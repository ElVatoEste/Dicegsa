import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { audit } from '../audit/audit';
import { normalizeAccountName } from '../auth/passwords';
import { DB, type Db } from '../db/db.module';
import { accounts, passwordResetRequests } from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';

const MAX_NOTE = 300;
const MAX_NAME = 64;

@Injectable()
export class ResetRequestsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Registra el pedido sin revelar si la cuenta existe: quien llama recibe siempre
   * la misma respuesta. Un segundo pedido sobre el mismo nombre mientras el
   * primero sigue abierto no suma otro, así nadie puede llenar la bandeja.
   */
  async request(rawName: string, rawNote: string | null) {
    const accountName = normalizeAccountName(rawName).slice(0, MAX_NAME);
    if (!accountName) throw new BadRequestException('Falta el nombre de cuenta');
    const note = rawNote?.trim().slice(0, MAX_NOTE) || null;

    const [open] = await this.db
      .select({ id: passwordResetRequests.id })
      .from(passwordResetRequests)
      .where(
        and(
          eq(sql`lower(${passwordResetRequests.accountName})`, accountName),
          eq(passwordResetRequests.status, 'pending'),
        ),
      )
      .limit(1);
    if (open) return;

    const [account] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(sql`lower(${accounts.accountName})`, accountName))
      .limit(1);

    const [created] = await this.db
      .insert(passwordResetRequests)
      .values({ accountName, accountId: account?.id ?? null, note })
      .returning();
    this.events.emit(ROOMS.accounts, 'reset_request.created', { id: created!.id, accountName });
  }

  list(limit = 100) {
    return this.db
      .select()
      .from(passwordResetRequests)
      .orderBy(desc(passwordResetRequests.createdAt))
      .limit(limit);
  }

  async dismiss(actorId: string, id: string) {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(passwordResetRequests)
        .set({ status: 'dismissed', resolvedBy: actorId, resolvedAt: new Date() })
        .where(and(eq(passwordResetRequests.id, id), eq(passwordResetRequests.status, 'pending')))
        .returning();
      if (!updated) throw new NotFoundException('No hay una solicitud pendiente con ese id');
      await audit(tx, actorId, 'dismiss', 'password_reset_request', id, { accountName: updated.accountName });
    });
    this.events.emit(ROOMS.accounts, 'reset_request.dismissed', { id });
  }
}
