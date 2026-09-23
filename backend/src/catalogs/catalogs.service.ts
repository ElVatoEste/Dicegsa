import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { audit } from '../audit/audit';
import { DB, type Db } from '../db/db.module';
import { catalogEntries, catalogKind, settings } from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';

export type CatalogKind = (typeof catalogKind.enumValues)[number];

/** Parámetros editables y su valor mientras nadie los cambie. */
export const SETTING_DEFAULTS: Record<string, unknown> = {
  /** Minutos antes de la entrega a partir de los cuales un pedido se marca como de pronta entrega. */
  urgentThresholdMinutes: 120,
};

@Injectable()
export class CatalogsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  list(kind: CatalogKind) {
    return this.db
      .select()
      .from(catalogEntries)
      .where(eq(catalogEntries.kind, kind))
      .orderBy(asc(catalogEntries.name));
  }

  async create(actorId: string, kind: CatalogKind, name: string) {
    const trimmed = name.trim();
    const entry = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: catalogEntries.id })
        .from(catalogEntries)
        .where(
          and(eq(catalogEntries.kind, kind), eq(sql`lower(${catalogEntries.name})`, trimmed.toLowerCase())),
        )
        .limit(1);
      if (existing) throw new ConflictException('Ya existe una entrada con ese nombre');

      const [created] = await tx.insert(catalogEntries).values({ kind, name: trimmed }).returning();
      await audit(tx, actorId, 'create', kind, created!.id, { name: trimmed });
      return created!;
    });
    this.events.emit(ROOMS.board, 'catalog.changed', { kind });
    return entry;
  }

  async setActive(actorId: string, kind: CatalogKind, id: string, active: boolean) {
    const entry = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(catalogEntries)
        .set({ active })
        .where(and(eq(catalogEntries.id, id), eq(catalogEntries.kind, kind)))
        .returning();
      if (!updated) throw new NotFoundException('No existe esa entrada');
      await audit(tx, actorId, active ? 'reactivate' : 'deactivate', kind, id);
      return updated;
    });
    this.events.emit(ROOMS.board, 'catalog.changed', { kind });
    return entry;
  }

  async readSettings(): Promise<Record<string, unknown>> {
    const rows = await this.db.select().from(settings);
    return { ...SETTING_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  }

  async writeSetting(actorId: string, key: string, value: unknown) {
    if (!(key in SETTING_DEFAULTS)) throw new NotFoundException('No existe ese parámetro');
    await this.db.transaction(async (tx) => {
      await tx
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
      await audit(tx, actorId, 'update', 'setting', key, { value });
    });
    this.events.emit(ROOMS.board, 'settings.changed', { key });
    return this.readSettings();
  }
}
