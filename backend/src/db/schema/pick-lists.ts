import { pgEnum, pgTable, serial, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const pickListStatus = pgEnum('pick_list_status', [
  'assigned',
  'picking',
  'validating',
  'returned',
  'done',
]);

/**
 * PKL: la orden de alisto. Agrupa pedidos, la trabaja un solo alistador y su
 * ciclo termina en la validación.
 */
export const pickLists = pgTable('pick_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: serial('number').notNull().unique(),
  status: pickListStatus('status').notNull().default('assigned'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => accounts.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
