import { sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const systemRole = pgEnum('system_role', [
  'operator',
  'validator',
  'control_desk',
  'supervisor',
  'management',
  'admin',
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

export type Account = typeof accounts.$inferSelect;
