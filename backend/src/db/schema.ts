import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const rolSistema = pgEnum('rol_sistema', [
  'operario',
  'supervisor',
  'gerencia',
  'admin',
]);

/** Rol en el piso. El OLE del MVP mide alistadores; el valeador se modela pero no se calcula. */
export const rolOperativo = pgEnum('rol_operativo', ['alistador', 'valeador']);

export const accionAdmin = pgEnum('accion_admin', [
  'alta',
  'reseteo',
  'cambio_rol',
  'baja',
  'reactivacion',
]);

export const cuentas = pgTable(
  'cuentas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Identificador de ingreso. No hay correo: el operario de bodega no tiene uno corporativo. */
    nombreCuenta: text('nombre_cuenta').notNull(),
    hashPassword: text('hash_password').notNull(),
    rol: rolSistema('rol').notNull().default('operario'),
    /** Las bajas desactivan. Borrar una cuenta rompería la trazabilidad de sus eventos. */
    activa: boolean('activa').notNull().default(true),
    /** Mientras esté en true el acceso se limita al cambio de contraseña. */
    debeCambiarPassword: boolean('debe_cambiar_password').notNull().default(true),
    creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadaEn: timestamp('actualizada_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cuentas_nombre_cuenta_unico').on(sql`lower(${t.nombreCuenta})`),
  ],
);

export const colaboradores = pgTable('colaboradores', {
  id: uuid('id').primaryKey().defaultRandom(),
  cuentaId: uuid('cuenta_id')
    .notNull()
    .unique()
    .references(() => cuentas.id),
  nombre: text('nombre').notNull(),
  rolOperativo: rolOperativo('rol_operativo').notNull().default('alistador'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Rastro de auditoría de las acciones administrativas sobre cuentas.
 * Un administrador puede resetear cualquier contraseña y por lo tanto tomar
 * cualquier identidad; este registro es lo único que lo vuelve verificable.
 */
export const eventosAdmin = pgTable('eventos_admin', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => cuentas.id),
  cuentaObjetivoId: uuid('cuenta_objetivo_id')
    .notNull()
    .references(() => cuentas.id),
  accion: accionAdmin('accion').notNull(),
  detalle: jsonb('detalle'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export type Cuenta = typeof cuentas.$inferSelect;
