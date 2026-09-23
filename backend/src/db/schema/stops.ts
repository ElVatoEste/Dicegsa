import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { stopCauses } from './stop-causes';
import { pickLists } from './pick-lists';

export const stops = pgTable('stops', {
  id: uuid('id').primaryKey().defaultRandom(),
  pickListId: uuid('pick_list_id')
    .notNull()
    .references(() => pickLists.id),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  causeId: uuid('cause_id')
    .notNull()
    .references(() => stopCauses.id),
  note: text('note'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});
