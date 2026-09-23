import { sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Catálogos configurables que no llevan más dato que el nombre. Una entrada se
 * desactiva y nunca se borra: los pedidos y errores que la usaron la siguen citando.
 */
export const catalogKind = pgEnum('catalog_kind', ['dispatch_zone', 'inventory_zone', 'error_type']);

export const catalogEntries = pgTable(
  'catalog_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: catalogKind('kind').notNull(),
    name: text('name').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_entries_kind_name_unique').on(t.kind, sql`lower(${t.name})`)],
);
