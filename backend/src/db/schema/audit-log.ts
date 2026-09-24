import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

/** Rastro general: quién hizo qué, sobre qué y cuándo, fuera de las acciones sobre cuentas. */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => accounts.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  details: jsonb('details'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});
