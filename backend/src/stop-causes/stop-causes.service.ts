import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { stopCauses } from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';

@Injectable()
export class StopCausesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  list() {
    return this.db.select().from(stopCauses).orderBy(asc(stopCauses.name));
  }

  async create(actorId: string, name: string, attributable: boolean) {
    const trimmed = name.trim();
    const [existing] = await this.db
      .select({ id: stopCauses.id })
      .from(stopCauses)
      .where(eq(sql`lower(${stopCauses.name})`, trimmed.toLowerCase()))
      .limit(1);
    if (existing) throw new ConflictException('Ya existe una causa con ese nombre');

    const [cause] = await this.db
      .insert(stopCauses)
      .values({ name: trimmed, attributable, createdBy: actorId })
      .returning();
    this.events.emit(ROOMS.board, 'stop_cause.created', cause);
    return cause!;
  }

  async setActive(id: string, active: boolean) {
    const [cause] = await this.db
      .update(stopCauses)
      .set({ active })
      .where(eq(stopCauses.id, id))
      .returning();
    if (!cause) throw new NotFoundException('No existe esa causa');
    this.events.emit(ROOMS.board, active ? 'stop_cause.reactivated' : 'stop_cause.deactivated', cause);
    return cause;
  }
}
