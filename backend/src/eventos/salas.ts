import type { RolSistema } from '../auth/acceso';

/** Canales a los que se suscribe una conexión, según el rol de su cuenta. */
export const SALAS = {
  /** Altas, reseteos, cambios de rol y bajas de cuentas. */
  cuentas: 'cuentas',
  /** Transiciones del tablero y paradas de alisto. */
  tablero: 'tablero',
} as const;

export type Sala = (typeof SALAS)[keyof typeof SALAS];

export interface Evento<T = unknown> {
  tipo: string;
  sala: Sala;
  datos: T;
  /** Instante del servidor en ISO 8601; el reloj del cliente no interviene. */
  emitidoEn: string;
}

const POR_ROL: Record<RolSistema, Sala[]> = {
  operario: [],
  supervisor: [SALAS.tablero],
  gerencia: [SALAS.tablero],
  admin: [SALAS.tablero, SALAS.cuentas],
};

/**
 * Un operario recibe sus propias órdenes por petición, no el tablero completo:
 * suscribirlo a todo filtraría el desempeño de sus compañeros.
 */
export function salasPara(rol: RolSistema): Sala[] {
  return POR_ROL[rol] ?? [];
}

export function puedeEscuchar(rol: RolSistema, sala: Sala): boolean {
  return salasPara(rol).includes(sala);
}
