import { date, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const lineStatus = pgEnum('line_status', ['pending', 'picked', 'not_found', 'cancelled']);

/** Un producto distinto del pedido. Las unidades del pedido son la suma de cantidades. */
export const orderLines = pgTable('order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  productCode: text('product_code').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  lot: text('lot').notNull(),
  expiresOn: date('expires_on'),
  status: lineStatus('status').notNull().default('pending'),
});
