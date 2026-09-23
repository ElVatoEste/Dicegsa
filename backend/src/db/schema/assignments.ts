import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { pickLists } from './pick-lists';

/**
 * Historial de a quién estuvo asignado cada PKL. La asignación vigente es la que
 * no tiene cierre; reasignar cierra una y abre otra, así el historial por
 * alistador conserva los PKL que tuvo.
 */
export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pickListId: uuid('pick_list_id')
    .notNull()
    .references(() => pickLists.id),
  assigneeId: uuid('assignee_id')
    .notNull()
    .references(() => accounts.id),
  assignedBy: uuid('assigned_by')
    .notNull()
    .references(() => accounts.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});
