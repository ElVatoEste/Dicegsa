import { jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const adminAction = pgEnum('admin_action', [
  'create',
  'reset_password',
  'change_role',
  'deactivate',
  'reactivate',
  'update_worker',
]);

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
