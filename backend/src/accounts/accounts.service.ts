import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { SystemRole } from '../auth/access';
import { generateInitialPassword, hashPassword, normalizeAccountName } from '../auth/passwords';
import { DB, type Db, type Tx } from '../db/db.module';
import { accounts, adminEvents, floorRole, passwordResetRequests, workers } from '../db/schema';
import { EventsGateway } from '../events/events.gateway';
import { ROOMS } from '../events/rooms';

export type FloorRole = (typeof floorRole.enumValues)[number];

const PUBLIC_FIELDS = {
  id: accounts.id,
  accountName: accounts.accountName,
  role: accounts.role,
  active: accounts.active,
  mustChangePassword: accounts.mustChangePassword,
  createdAt: accounts.createdAt,
  updatedAt: accounts.updatedAt,
};

@Injectable()
export class AccountsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Se publica después de confirmar la transacción: emitir antes anunciaría un
   * cambio que un error posterior deja sin aplicar.
   */
  private publish(action: string, account: { id: string; accountName: string }) {
    this.events.emit(ROOMS.accounts, `account.${action}`, account);
  }

  /** El perfil de colaborador viene en null para las cuentas que no trabajan en el piso. */
  list() {
    return this.db
      .select({ ...PUBLIC_FIELDS, fullName: workers.fullName, floorRole: workers.floorRole })
      .from(accounts)
      .leftJoin(workers, eq(workers.accountId, accounts.id))
      .orderBy(accounts.accountName);
  }

  /** Devuelve la contraseña inicial en claro una sola vez: es lo que el administrador entrega en mano. */
  async create(actorId: string, accountName: string, role: SystemRole) {
    const name = normalizeAccountName(accountName);
    if (!name) throw new BadRequestException('El nombre de cuenta no puede estar vacío');

    const initialPassword = generateInitialPassword();
    const hash = await hashPassword(initialPassword);

    const created = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(sql`lower(${accounts.accountName})`, name))
        .limit(1);
      if (existing) throw new ConflictException('Ya existe una cuenta con ese nombre');

      const [account] = await tx
        .insert(accounts)
        .values({ accountName: name, passwordHash: hash, role, mustChangePassword: true })
        .returning(PUBLIC_FIELDS);

      await tx.insert(adminEvents).values({
        actorId,
        targetAccountId: account!.id,
        action: 'create',
        details: { role },
      });
      return account!;
    });

    this.publish('created', created);
    return { account: created, initialPassword };
  }

  /** Reinicia el ciclo de primer ingreso: la contraseña vuelve a ser de un solo uso. */
  async resetPassword(actorId: string, accountId: string) {
    const initialPassword = generateInitialPassword();
    const hash = await hashPassword(initialPassword);

    const account = await this.db.transaction(async (tx) => {
      await this.requireExisting(tx, accountId);
      const [updated] = await tx
        .update(accounts)
        .set({ passwordHash: hash, mustChangePassword: true, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))
        .returning(PUBLIC_FIELDS);

      await tx.insert(adminEvents).values({
        actorId,
        targetAccountId: accountId,
        action: 'reset_password',
        details: null,
      });
      // Las solicitudes abiertas de esa cuenta quedan atendidas por este reinicio.
      await tx
        .update(passwordResetRequests)
        .set({ status: 'resolved', resolvedBy: actorId, resolvedAt: new Date() })
        .where(
          and(
            eq(sql`lower(${passwordResetRequests.accountName})`, updated!.accountName.toLowerCase()),
            eq(passwordResetRequests.status, 'pending'),
          ),
        );
      return updated!;
    });

    this.publish('password_reset', account);
    return { account, initialPassword };
  }

  async changeRole(actorId: string, accountId: string, role: SystemRole) {
    // Un administrador que se cambia el rol a sí mismo pierde el acceso administrativo
    // y ninguna ruta del API se lo devuelve.
    if (actorId === accountId) {
      throw new BadRequestException('No se puede cambiar el rol de la propia cuenta');
    }

    const account = await this.db.transaction(async (tx) => {
      const previous = await this.requireExisting(tx, accountId);
      const [updated] = await tx
        .update(accounts)
        .set({ role, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))
        .returning(PUBLIC_FIELDS);

      await tx.insert(adminEvents).values({
        actorId,
        targetAccountId: accountId,
        action: 'change_role',
        details: { from: previous.role, to: role },
      });
      return updated!;
    });

    this.publish('role_changed', account);
    return account;
  }

  /**
   * Las cuentas se desactivan, nunca se borran: sus eventos de alisto y sus
   * cálculos de OLE tienen que seguir siendo trazables.
   */
  async setActive(actorId: string, accountId: string, active: boolean) {
    if (actorId === accountId) {
      throw new BadRequestException('No se puede dar de baja la propia cuenta');
    }

    const account = await this.db.transaction(async (tx) => {
      await this.requireExisting(tx, accountId);
      const [updated] = await tx
        .update(accounts)
        .set({ active, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))
        .returning(PUBLIC_FIELDS);

      await tx.insert(adminEvents).values({
        actorId,
        targetAccountId: accountId,
        action: active ? 'reactivate' : 'deactivate',
        details: null,
      });
      return updated!;
    });

    this.publish(active ? 'reactivated' : 'deactivated', account);
    return account;
  }

  /** Alta o edición del perfil de colaborador, que es a quien se le calcula el OLE. */
  async upsertWorker(actorId: string, accountId: string, fullName: string, floorRole: FloorRole) {
    const name = fullName.trim();
    const worker = await this.db.transaction(async (tx) => {
      await this.requireExisting(tx, accountId);
      const [saved] = await tx
        .insert(workers)
        .values({ accountId, fullName: name, floorRole })
        .onConflictDoUpdate({ target: workers.accountId, set: { fullName: name, floorRole } })
        .returning();

      await tx.insert(adminEvents).values({
        actorId,
        targetAccountId: accountId,
        action: 'update_worker',
        details: { fullName: name, floorRole },
      });
      return saved!;
    });

    this.events.emit(ROOMS.accounts, 'account.worker_updated', worker);
    return worker;
  }

  auditLog(limit = 200) {
    return this.db.select().from(adminEvents).orderBy(desc(adminEvents.createdAt)).limit(limit);
  }

  private async requireExisting(tx: Db | Tx, accountId: string) {
    const [account] = await tx
      .select({ id: accounts.id, role: accounts.role })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);
    if (!account) throw new NotFoundException('No existe esa cuenta');
    return account;
  }
}
