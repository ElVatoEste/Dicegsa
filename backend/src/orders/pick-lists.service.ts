import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { audit } from '../audit/audit';
import { DB, type Db, type Tx } from '../db/db.module';
import {
  accounts,
  assignments,
  catalogEntries,
  orderLines,
  orders,
  pickEvents,
  pickLists,
  stopCauses,
  stops,
  validationErrors,
  workers,
} from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';
import { afterValidation, canDeliver, canReassign, isWorkable, type PickListStatus } from './rules';

export interface ValidationErrorInput {
  lineId: string;
  errorTypeId: string;
  units: number;
  note: string | null;
}

const MARK_EVENT = {
  picked: 'line_picked',
  not_found: 'line_not_found',
  pending: 'line_reset',
} as const;

export type LineMark = keyof typeof MARK_EVENT;

@Injectable()
export class PickListsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  private changed(pickListId: string, assigneeId: string | null, type: string) {
    this.events.emit(ROOMS.board, type, { id: pickListId });
    if (assigneeId) this.events.emitToAccount(assigneeId, type, { id: pickListId });
  }

  /** Arma un PKL con pedidos sin asignar y se lo asigna a un alistador. */
  async create(actorId: string, orderIds: string[], assigneeId: string) {
    if (orderIds.length === 0) throw new BadRequestException('Elegí al menos un pedido');

    const pickList = await this.db.transaction(async (tx) => {
      await this.requirePicker(tx, assigneeId);

      const selected = await tx.select().from(orders).where(inArray(orders.id, orderIds));
      if (selected.length !== new Set(orderIds).size) throw new NotFoundException('Algún pedido no existe');
      const taken = selected.find((o) => o.pickListId || o.cancelledAt);
      if (taken) {
        throw new BadRequestException(`El pedido ${taken.externalId} ya está en un PKL o dado de baja`);
      }

      const [created] = await tx.insert(pickLists).values({ createdBy: actorId }).returning();
      await tx.update(orders).set({ pickListId: created!.id }).where(inArray(orders.id, orderIds));
      await tx.insert(assignments).values({ pickListId: created!.id, assigneeId, assignedBy: actorId });
      await audit(tx, actorId, 'create', 'pick_list', created!.id, {
        number: created!.number,
        orders: selected.map((o) => o.externalId),
        assigneeId,
      });
      return created!;
    });

    this.changed(pickList.id, assigneeId, 'pick_list.assigned');
    return pickList;
  }

  /**
   * Pasa el PKL a otro alistador. Pasa cuando la entrega está próxima y el
   * asignado no terminó en su horario; lo ya marcado queda a nombre de quien lo hizo.
   */
  async reassign(actorId: string, id: string, assigneeId: string) {
    let previous: string | null = null;
    await this.db.transaction(async (tx) => {
      const pickList = await this.requirePickList(tx, id);
      if (!canReassign(pickList.status)) {
        throw new BadRequestException('Un PKL en validación o terminado no se reasigna');
      }
      await this.requirePicker(tx, assigneeId);

      const current = await this.currentAssignment(tx, id);
      previous = current?.assigneeId ?? null;
      if (previous === assigneeId) throw new BadRequestException('El PKL ya está asignado a esa persona');

      if (current) {
        await tx.update(assignments).set({ endedAt: new Date() }).where(eq(assignments.id, current.id));
      }
      await tx.insert(assignments).values({ pickListId: id, assigneeId, assignedBy: actorId });
      // Si quedó una parada abierta, era del alistador anterior y no del nuevo.
      await tx.update(stops).set({ endedAt: new Date() }).where(and(eq(stops.pickListId, id), isNull(stops.endedAt)));
      await audit(tx, actorId, 'reassign', 'pick_list', id, { from: previous, to: assigneeId });
    });

    if (previous) this.events.emitToAccount(previous, 'pick_list.unassigned', { id });
    this.changed(id, assigneeId, 'pick_list.assigned');
  }

  /** Los PKL del alistador, con pedidos, líneas y la parada abierta si la hay. */
  async mine(accountId: string) {
    const own = await this.db
      .select({ id: pickLists.id })
      .from(pickLists)
      .innerJoin(assignments, eq(assignments.pickListId, pickLists.id))
      .where(
        and(
          eq(assignments.assigneeId, accountId),
          isNull(assignments.endedAt),
          ne(pickLists.status, 'done'),
        ),
      )
      .orderBy(asc(pickLists.number));
    return Promise.all(own.map((p) => this.detail(p.id)));
  }

  /** PKL entregados que esperan revisión. */
  async validationQueue() {
    const queue = await this.db
      .select({ id: pickLists.id })
      .from(pickLists)
      .where(eq(pickLists.status, 'validating'))
      .orderBy(asc(pickLists.number));
    return Promise.all(queue.map((p) => this.detail(p.id)));
  }

  async detail(id: string) {
    const pickList = await this.requirePickList(this.db, id);
    const current = await this.currentAssignment(this.db, id);
    const [assignee] = current
      ? await this.db
          .select({ id: accounts.id, accountName: accounts.accountName, fullName: workers.fullName })
          .from(accounts)
          .leftJoin(workers, eq(workers.accountId, accounts.id))
          .where(eq(accounts.id, current.assigneeId))
      : [];

    const pickOrders = await this.db
      .select()
      .from(orders)
      .where(eq(orders.pickListId, id))
      .orderBy(asc(orders.dueAt));
    const lines = pickOrders.length
      ? await this.db
          .select()
          .from(orderLines)
          .where(inArray(orderLines.orderId, pickOrders.map((o) => o.id)))
          .orderBy(asc(orderLines.productName))
      : [];
    const [openStop] = await this.db
      .select({ id: stops.id, causeId: stops.causeId, causeName: stopCauses.name, startedAt: stops.startedAt })
      .from(stops)
      .innerJoin(stopCauses, eq(stopCauses.id, stops.causeId))
      .where(and(eq(stops.pickListId, id), isNull(stops.endedAt)))
      .limit(1);
    const errors = await this.db
      .select({
        id: validationErrors.id,
        lineId: validationErrors.lineId,
        units: validationErrors.units,
        note: validationErrors.note,
        errorType: catalogEntries.name,
        createdAt: validationErrors.createdAt,
      })
      .from(validationErrors)
      .innerJoin(catalogEntries, eq(catalogEntries.id, validationErrors.errorTypeId))
      .where(eq(validationErrors.pickListId, id))
      .orderBy(desc(validationErrors.createdAt));

    return {
      ...pickList,
      assignee: assignee
        ? { id: assignee.id, name: assignee.fullName ?? assignee.accountName, assignedAt: current!.assignedAt }
        : null,
      dueAt: pickOrders[0]?.dueAt ?? null,
      orders: pickOrders.map((o) => ({ ...o, lines: lines.filter((l) => l.orderId === o.id) })),
      openStop: openStop ?? null,
      errors,
    };
  }

  async start(accountId: string, id: string) {
    await this.db.transaction(async (tx) => {
      const pickList = await this.requireWorkableByAssignee(tx, accountId, id);
      if (pickList.status !== 'assigned') return;
      await tx.update(pickLists).set({ status: 'picking' }).where(eq(pickLists.id, id));
      await tx.insert(pickEvents).values({ pickListId: id, accountId, type: 'started' });
    });
    this.changed(id, null, 'pick_list.started');
    return this.detail(id);
  }

  async markLine(accountId: string, id: string, lineId: string, mark: LineMark) {
    await this.db.transaction(async (tx) => {
      const pickList = await this.requireWorkableByAssignee(tx, accountId, id);
      const line = await this.requireLineOf(tx, id, lineId);
      if (line.status === 'cancelled') throw new BadRequestException('La línea está dada de baja');

      // Marcar sin haber empezado arranca el PKL: el cronómetro no puede quedar sin inicio.
      if (pickList.status === 'assigned') {
        await tx.update(pickLists).set({ status: 'picking' }).where(eq(pickLists.id, id));
        await tx.insert(pickEvents).values({ pickListId: id, accountId, type: 'started' });
      }
      await tx.update(orderLines).set({ status: mark }).where(eq(orderLines.id, lineId));
      await tx.insert(pickEvents).values({ pickListId: id, lineId, accountId, type: MARK_EVENT[mark] });
    });
    this.changed(id, null, 'pick_list.line_marked');
    return this.detail(id);
  }

  async startStop(accountId: string, id: string, causeId: string, note: string | null) {
    await this.db.transaction(async (tx) => {
      await this.requireWorkableByAssignee(tx, accountId, id);
      const [open] = await tx
        .select({ id: stops.id })
        .from(stops)
        .where(and(eq(stops.pickListId, id), isNull(stops.endedAt)))
        .limit(1);
      if (open) throw new BadRequestException('Ya hay una parada abierta');
      const [cause] = await tx
        .select({ id: stopCauses.id })
        .from(stopCauses)
        .where(and(eq(stopCauses.id, causeId), eq(stopCauses.active, true)))
        .limit(1);
      if (!cause) throw new BadRequestException('La causa no existe o está desactivada');
      await tx.insert(stops).values({ pickListId: id, accountId, causeId, note });
    });
    this.changed(id, null, 'pick_list.stop_started');
    return this.detail(id);
  }

  async endStop(accountId: string, id: string) {
    await this.db.transaction(async (tx) => {
      await this.requireWorkableByAssignee(tx, accountId, id);
      await tx.update(stops).set({ endedAt: new Date() }).where(and(eq(stops.pickListId, id), isNull(stops.endedAt)));
    });
    this.changed(id, null, 'pick_list.stop_ended');
    return this.detail(id);
  }

  async deliver(accountId: string, id: string) {
    await this.db.transaction(async (tx) => {
      await this.requireWorkableByAssignee(tx, accountId, id);
      const lines = await this.linesOf(tx, id);
      if (!canDeliver(lines.map((l) => l.status))) {
        throw new BadRequestException('Faltan líneas por alistar o hay productos sin encontrar');
      }
      await tx.update(stops).set({ endedAt: new Date() }).where(and(eq(stops.pickListId, id), isNull(stops.endedAt)));
      await tx.update(pickLists).set({ status: 'validating' }).where(eq(pickLists.id, id));
      await tx.insert(pickEvents).values({ pickListId: id, accountId, type: 'delivered' });
    });
    this.changed(id, null, 'pick_list.delivered');
  }

  /**
   * Cierra la revisión. Los errores quedan a nombre del alistador asignado y, si
   * hay alguno, el PKL vuelve a él para corregir.
   */
  async validate(validatorId: string, id: string, errors: ValidationErrorInput[]) {
    let pickerId: string | null = null;
    await this.db.transaction(async (tx) => {
      const pickList = await this.requirePickList(tx, id);
      if (pickList.status !== 'validating') throw new BadRequestException('El PKL no está en validación');
      const current = await this.currentAssignment(tx, id);
      if (!current) throw new BadRequestException('El PKL no tiene alistador asignado');
      pickerId = current.assigneeId;

      const lines = await this.linesOf(tx, id);
      for (const e of errors) {
        const line = lines.find((l) => l.id === e.lineId);
        if (!line) throw new BadRequestException('Un error apunta a una línea que no es de este PKL');
        if (e.units > line.quantity) {
          throw new BadRequestException(`Las unidades con error superan las de la línea ${line.productName}`);
        }
        const [type] = await tx
          .select({ id: catalogEntries.id })
          .from(catalogEntries)
          .where(
            and(
              eq(catalogEntries.id, e.errorTypeId),
              eq(catalogEntries.kind, 'error_type'),
              eq(catalogEntries.active, true),
            ),
          )
          .limit(1);
        if (!type) throw new BadRequestException('El tipo de error no existe o está desactivado');
      }

      if (errors.length) {
        await tx.insert(validationErrors).values(
          errors.map((e) => ({ ...e, pickListId: id, pickerId: current.assigneeId, validatorId })),
        );
        // Las líneas con error se vuelven a alistar.
        await tx
          .update(orderLines)
          .set({ status: 'pending' })
          .where(inArray(orderLines.id, errors.map((e) => e.lineId)));
      }
      const next = afterValidation(errors.length);
      await tx.update(pickLists).set({ status: next }).where(eq(pickLists.id, id));
      await tx.insert(pickEvents).values({
        pickListId: id,
        accountId: validatorId,
        type: next === 'done' ? 'validated' : 'returned',
      });
    });
    this.changed(id, pickerId, errors.length ? 'pick_list.returned' : 'pick_list.validated');
  }

  /** Alistadores activos a los que mesa de control puede asignar. */
  pickers() {
    return this.db
      .select({ id: accounts.id, accountName: accounts.accountName, fullName: workers.fullName })
      .from(accounts)
      .innerJoin(workers, eq(workers.accountId, accounts.id))
      .where(and(eq(accounts.role, 'operator'), eq(accounts.active, true)))
      .orderBy(asc(workers.fullName));
  }

  private async requirePickList(tx: Db | Tx, id: string) {
    const [pickList] = await tx.select().from(pickLists).where(eq(pickLists.id, id)).limit(1);
    if (!pickList) throw new NotFoundException('No existe ese PKL');
    return pickList as typeof pickList & { status: PickListStatus };
  }

  private async currentAssignment(tx: Db | Tx, pickListId: string) {
    const [current] = await tx
      .select()
      .from(assignments)
      .where(and(eq(assignments.pickListId, pickListId), isNull(assignments.endedAt)))
      .limit(1);
    return current ?? null;
  }

  /** Solo el alistador asignado trabaja su PKL, y solo mientras no esté en validación. */
  private async requireWorkableByAssignee(tx: Db | Tx, accountId: string, id: string) {
    const pickList = await this.requirePickList(tx, id);
    const current = await this.currentAssignment(tx, id);
    if (current?.assigneeId !== accountId) throw new ForbiddenException('Este PKL no está asignado a vos');
    if (!isWorkable(pickList.status)) throw new BadRequestException('El PKL ya fue entregado');
    return pickList;
  }

  private linesOf(tx: Db | Tx, pickListId: string) {
    return tx
      .select({
        id: orderLines.id,
        status: orderLines.status,
        quantity: orderLines.quantity,
        productName: orderLines.productName,
      })
      .from(orderLines)
      .innerJoin(orders, eq(orders.id, orderLines.orderId))
      .where(eq(orders.pickListId, pickListId));
  }

  private async requireLineOf(tx: Db | Tx, pickListId: string, lineId: string) {
    const [line] = await tx
      .select({ id: orderLines.id, status: orderLines.status })
      .from(orderLines)
      .innerJoin(orders, eq(orders.id, orderLines.orderId))
      .where(and(eq(orderLines.id, lineId), eq(orders.pickListId, pickListId)))
      .limit(1);
    if (!line) throw new NotFoundException('La línea no es de este PKL');
    return line;
  }

  private async requirePicker(tx: Db | Tx, accountId: string) {
    const [picker] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .innerJoin(workers, eq(workers.accountId, accounts.id))
      .where(and(eq(accounts.id, accountId), eq(accounts.role, 'operator'), eq(accounts.active, true)))
      .limit(1);
    if (!picker) throw new BadRequestException('Esa cuenta no es un alistador activo con perfil');
  }
}
