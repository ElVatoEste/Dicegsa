import { sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

/**
 * Causas de parada. La imputabilidad y el nombre no se editan: el OLE ya calculado
 * tiene que poder recalcularse igual desde sus eventos, y cambiar la clasificación
 * de una causa en uso cambiaría la Disponibilidad de turnos pasados. Una causa mal
 * cargada se desactiva y se crea otra.
 */
export const stopCauses = pgTable(
  'stop_causes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    /** Imputable al colaborador: no descuenta de la Disponibilidad. */
    attributable: boolean('attributable').notNull(),
    /** Una causa desactivada deja de ofrecerse, pero sigue explicando las paradas que la usaron. */
    active: boolean('active').notNull().default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => accounts.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('stop_causes_name_unique').on(sql`lower(${t.name})`)],
);
