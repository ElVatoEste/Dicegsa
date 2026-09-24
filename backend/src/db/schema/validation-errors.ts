import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { catalogEntries } from './catalog-entries';
import { pickLists } from './pick-lists';
import { orderLines } from './order-lines';

/** Reemplaza la hoja firmada que el validador entrega hoy al supervisor. */
export const validationErrors = pgTable('validation_errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  pickListId: uuid('pick_list_id')
    .notNull()
    .references(() => pickLists.id),
  lineId: uuid('line_id')
    .notNull()
    .references(() => orderLines.id),
  pickerId: uuid('picker_id')
    .notNull()
    .references(() => accounts.id),
  validatorId: uuid('validator_id')
    .notNull()
    .references(() => accounts.id),
  errorTypeId: uuid('error_type_id')
    .notNull()
    .references(() => catalogEntries.id),
  units: integer('units').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
