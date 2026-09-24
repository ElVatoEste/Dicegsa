import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { pickLists } from './pick-lists';
import { orderLines } from './order-lines';

export const pickEventType = pgEnum('pick_event_type', [
  'started',
  'line_picked',
  'line_not_found',
  'line_reset',
  'delivered',
  'validated',
  'returned',
]);

/**
 * Lo que pasa sobre un PKL, en orden y con hora del servidor. El cronometraje y
 * el Desempeño se recalculan desde acá, no desde el estado actual.
 */
export const pickEvents = pgTable('pick_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  pickListId: uuid('pick_list_id')
    .notNull()
    .references(() => pickLists.id),
  lineId: uuid('line_id').references(() => orderLines.id),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  type: pickEventType('type').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});
