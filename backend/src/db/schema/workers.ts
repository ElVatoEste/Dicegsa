import { numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

/** Rol en el piso. El cálculo de OLE cubre alistadores; el validador se registra pero no se calcula. */
export const floorRole = pgEnum('floor_role', ['picker', 'checker']);

export const workers = pgTable('workers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id),
  fullName: text('full_name').notNull(),
  floorRole: floorRole('floor_role').notNull().default('picker'),
  /** Monto mensual que se multiplica por el OLE del mes para calcular el incentivo. */
  incentiveBase: numeric('incentive_base', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
