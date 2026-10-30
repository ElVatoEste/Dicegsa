import { date, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

/** Inventario cargado desde el ERP. Una fila por lote en una zona del almacén. */
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  barcode: text('barcode'),
  name: text('name').notNull(),
  manufacturer: text('manufacturer'),
  zone: text('zone'),
  lot: text('lot'),
  expiresOn: date('expires_on'),
  quantity: integer('quantity').notNull(),
});
