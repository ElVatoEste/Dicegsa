import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { audit } from '../audit/audit';
import { DB, type Db, type Tx } from '../db/db.module';
import {
  accounts,
  assignments,
  catalogEntries,
  orderLines,
  orders,
  pickLists,
  workers,
} from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';
import type { OrderInput } from './dto';
import { canRelease, orderStatus, type PickListStatus } from './rules';

export interface OrderPatch {
  dispatchZoneId?: string | null;
  inventoryZoneId?: string | null;
  dueAt?: Date;
  notes?: string | null;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  private changed(type: string, data: unknown) {
    this.events.emit(ROOMS.board, type, data);
  }

  /** La tabla de mesa de control: un pedido por fila, con su PKL y quién lo tiene. */
  async list() {
    const rows = await this.db
      .select({
        order: orders,
        pickListNumber: pickLists.number,
        pickListStatus: pickLists.status,
        assigneeId: assignments.assigneeId,
        assigneeName: workers.fullName,
        assigneeAccount: accounts.accountName,
      })
      .from(orders)
      .leftJoin(pickLists, eq(pickLists.id, orders.pickListId))
      .leftJoin(
        assignments,
        and(eq(assignments.pickListId, pickLists.id), isNull(assignments.endedAt)),
      )
      .leftJoin(accounts, eq(accounts.id, assignments.assigneeId))
      .leftJoin(workers, eq(workers.accountId, assignments.assigneeId))
      .orderBy(asc(orders.dueAt));

    const lines = rows.length
      ? await this.db
          .select({
            orderId: orderLines.orderId,
            quantity: orderLines.quantity,
            status: orderLines.status,
          })
          .from(orderLines)
          .where(inArray(orderLines.orderId, rows.map((r) => r.order.id)))
      : [];

    return rows.map((r) => {
      const own = lines.filter((l) => l.orderId === r.order.id && l.status !== 'cancelled');
      return {
        ...r.order,
        status: orderStatus(r.order.cancelledAt !== null, r.pickListStatus),
        pickListNumber: r.pickListNumber,
        assignee: r.assigneeId
          ? { id: r.assigneeId, name: r.assigneeName ?? r.assigneeAccount }
          : null,
        lineCount: own.length,
        units: own.reduce((sum, l) => sum + l.quantity, 0),
      };
    });
  }

  async detail(id: string) {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw new NotFoundException('No existe ese pedido');
    const lines = await this.db
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, id))
      .orderBy(asc(orderLines.productName));
    return { ...order, lines };
  }

  async create(actorId: string, input: OrderInput) {
    const created = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.externalId, input.externalId))
        .limit(1);
      if (existing) throw new ConflictException(`El pedido ${input.externalId} ya está cargado`);

      await this.requireZone(tx, input.dispatchZoneId, 'dispatch_zone');
      await this.requireZone(tx, input.inventoryZoneId, 'inventory_zone');

      const { lines, ...header } = input;
      const [order] = await tx
        .insert(orders)
        .values({ ...header, createdBy: actorId })
        .returning();
      await tx.insert(orderLines).values(lines.map((l) => ({ ...l, orderId: order!.id })));
      await audit(tx, actorId, 'create', 'order', order!.id, {
        externalId: order!.externalId,
        lines: lines.length,
      });
      return order!;
    });
    this.changed('order.created', { id: created.id });
    return created;
  }

  /** Zonas, notas y fecha de entrega. Un cambio de fecha deja en el rastro la anterior y la nueva. */
  async update(actorId: string, id: string, patch: OrderPatch) {
    const updated = await this.db.transaction(async (tx) => {
      const [before] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!before) throw new NotFoundException('No existe ese pedido');
      if (before.cancelledAt) throw new BadRequestException('El pedido está dado de baja');

      if (patch.dispatchZoneId !== undefined) await this.requireZone(tx, patch.dispatchZoneId, 'dispatch_zone');
      if (patch.inventoryZoneId !== undefined) await this.requireZone(tx, patch.inventoryZoneId, 'inventory_zone');

      const [after] = await tx.update(orders).set(patch).where(eq(orders.id, id)).returning();

      const diff: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of Object.keys(patch) as (keyof OrderPatch)[]) {
        const from = before[key] instanceof Date ? (before[key] as Date).toISOString() : before[key];
        const to = after![key] instanceof Date ? (after![key] as Date).toISOString() : after![key];
        if (from !== to) diff[key] = { from, to };
      }
      if (Object.keys(diff).length) await audit(tx, actorId, 'update', 'order', id, diff);
      return after!;
    });
    this.changed('order.updated', { id });
    return updated;
  }

  /** Baja del pedido entero, cuando televentas lo anula. */
  async cancel(actorId: string, id: string) {
    await this.db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) throw new NotFoundException('No existe ese pedido');
      if (order.cancelledAt) return;
      await tx.update(orders).set({ cancelledAt: new Date() }).where(eq(orders.id, id));
      await tx.update(orderLines).set({ status: 'cancelled' }).where(eq(orderLines.orderId, id));
      await audit(tx, actorId, 'cancel', 'order', id);
    });
    this.changed('order.cancelled', { id });
  }

  /**
   * Saca un pedido de su PKL y lo devuelve a "sin asignar". Si el PKL queda sin
   * pedidos, se cierra la asignación para que desaparezca de la vista del alistador.
   */
  async release(actorId: string, id: string) {
    let assigneeId: string | null = null;
    await this.db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) throw new NotFoundException('No existe ese pedido');
      if (!order.pickListId) throw new BadRequestException('El pedido no está asignado');

      const [pickList] = await tx.select().from(pickLists).where(eq(pickLists.id, order.pickListId)).limit(1);
      const lines = await tx.select({ status: orderLines.status }).from(orderLines).where(eq(orderLines.orderId, id));
      if (!canRelease(pickList!.status as PickListStatus, lines.map((l) => l.status))) {
        throw new BadRequestException('El alistador ya empezó este pedido: no se puede devolver a sin asignar');
      }

      await tx.update(orders).set({ pickListId: null }).where(eq(orders.id, id));
      const [current] = await tx
        .select()
        .from(assignments)
        .where(and(eq(assignments.pickListId, pickList!.id), isNull(assignments.endedAt)))
        .limit(1);
      assigneeId = current?.assigneeId ?? null;

      const [remaining] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.pickListId, pickList!.id))
        .limit(1);
      if (!remaining && current) {
        await tx.update(assignments).set({ endedAt: new Date() }).where(eq(assignments.id, current.id));
      }
      await audit(tx, actorId, 'release', 'order', id, { pickListId: pickList!.id, number: pickList!.number });
    });
    this.changed('order.released', { id });
    if (assigneeId) this.events.emitToAccount(assigneeId, 'pick_list.changed', { orderId: id });
  }

  /** Baja de una línea sin existencias, cuando televentas la saca del pedido. */
  async cancelLine(actorId: string, lineId: string) {
    const line = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orderLines)
        .set({ status: 'cancelled' })
        .where(eq(orderLines.id, lineId))
        .returning();
      if (!updated) throw new NotFoundException('No existe esa línea');
      await audit(tx, actorId, 'cancel', 'order_line', lineId, { orderId: updated.orderId });
      return updated;
    });
    this.changed('order.updated', { id: line.orderId });
    return line;
  }

  private async requireZone(tx: Db | Tx, id: string | null, kind: 'dispatch_zone' | 'inventory_zone') {
    if (!id) return;
    const [zone] = await tx
      .select({ id: catalogEntries.id })
      .from(catalogEntries)
      .where(and(eq(catalogEntries.id, id), eq(catalogEntries.kind, kind), eq(catalogEntries.active, true)))
      .limit(1);
    if (!zone) throw new BadRequestException('La zona no existe o está desactivada');
  }
}
