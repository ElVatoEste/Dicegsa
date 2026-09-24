import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { catalogEntries } from './catalog-entries';
import { pickLists } from './pick-lists';

/** Pedido de un cliente tal como llega del ERP. Sin maestro de clientes ni de productos. */
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').notNull().unique(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  clientCode: text('client_code').notNull(),
  clientName: text('client_name').notNull(),
  department: text('department').notNull(),
  municipality: text('municipality').notNull(),
  notes: text('notes'),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  dispatchZoneId: uuid('dispatch_zone_id').references(() => catalogEntries.id),
  inventoryZoneId: uuid('inventory_zone_id').references(() => catalogEntries.id),
  pickListId: uuid('pick_list_id').references(() => pickLists.id),
  /** Baja del pedido entero por televentas. */
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => accounts.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
