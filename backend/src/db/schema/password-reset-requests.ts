import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const resetRequestStatus = pgEnum('reset_request_status', ['pending', 'resolved', 'dismissed']);

/**
 * Pedidos de cambio de contraseña hechos desde el ingreso. Se guarda el nombre tal
 * como se tipeó aunque no exista la cuenta: los intentos sobre nombres ajenos
 * también son información para el administrador.
 */
export const passwordResetRequests = pgTable('password_reset_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountName: text('account_name').notNull(),
  accountId: uuid('account_id').references(() => accounts.id),
  note: text('note'),
  status: resetRequestStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedBy: uuid('resolved_by').references(() => accounts.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});
