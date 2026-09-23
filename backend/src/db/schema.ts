import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const systemRole = pgEnum('system_role', ['operator', 'supervisor', 'management', 'admin']);

/** Rol en el piso. El cálculo de OLE cubre alistadores; el validador se registra pero no se calcula. */
export const floorRole = pgEnum('floor_role', ['picker', 'checker']);

export const adminAction = pgEnum('admin_action', [
  'create',
  'reset_password',
  'change_role',
  'deactivate',
  'reactivate',
  'update_worker',
]);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Identificador de ingreso. No hay correo: el operario de bodega no tiene uno corporativo. */
    accountName: text('account_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: systemRole('role').notNull().default('operator'),
    /** Las bajas desactivan. Borrar una cuenta rompería la trazabilidad de sus eventos. */
    active: boolean('active').notNull().default(true),
    /** Mientras esté en true el acceso se limita al cambio de contraseña. */
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('accounts_account_name_unique').on(sql`lower(${t.accountName})`)],
);

export const workers = pgTable('workers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id),
  fullName: text('full_name').notNull(),
  floorRole: floorRole('floor_role').notNull().default('picker'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Causas de parada. La imputabilidad y el nombre no se editan: el OLE ya calculado
 * tiene que poder recalcularse igual desde sus eventos, y cambiar la clasificación
 * de una causa en uso cambiaría la Disponibilidad de turnos pasados. Una causa mal
 * cargada se desactiva y se crea otra.
 */
export const stopCauses = pgTable(
  'stop_causes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    /** Imputable al colaborador: no descuenta de la Disponibilidad. */
    attributable: boolean('attributable').notNull(),
    /** Una causa desactivada deja de ofrecerse, pero sigue explicando las paradas que la usaron. */
    active: boolean('active').notNull().default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => accounts.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('stop_causes_name_unique').on(sql`lower(${t.name})`)],
);

/**
 * Rastro de auditoría de las acciones administrativas sobre cuentas.
 * Un administrador puede reiniciar cualquier contraseña y por lo tanto tomar
 * cualquier identidad; este registro es lo único que lo vuelve verificable.
 */
export const adminEvents = pgTable('admin_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => accounts.id),
  targetAccountId: uuid('target_account_id')
    .notNull()
    .references(() => accounts.id),
  action: adminAction('action').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Account = typeof accounts.$inferSelect;
