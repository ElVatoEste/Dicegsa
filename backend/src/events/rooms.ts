import type { SystemRole } from '../auth/access';

/** Canales a los que se suscribe una conexión, según el rol de su cuenta. */
export const ROOMS = {
  /** Altas, reinicios, cambios de rol y bajas de cuentas. */
  accounts: 'accounts',
  /** Transiciones del tablero y paradas de alisto. */
  board: 'board',
} as const;

export type Room = (typeof ROOMS)[keyof typeof ROOMS];

export interface Event<T = unknown> {
  type: string;
  room: Room;
  data: T;
  /** Instante del servidor en ISO 8601; el reloj del cliente no interviene. */
  emittedAt: string;
}

const BY_ROLE: Record<SystemRole, Room[]> = {
  operator: [],
  supervisor: [ROOMS.board],
  management: [ROOMS.board],
  admin: [ROOMS.board, ROOMS.accounts],
};

/**
 * Un operario recibe sus propias órdenes por petición, no el tablero completo:
 * suscribirlo a todo filtraría el desempeño de sus compañeros.
 */
export function roomsFor(role: SystemRole): Room[] {
  return BY_ROLE[role] ?? [];
}

export function canListen(role: SystemRole, room: Room): boolean {
  return roomsFor(role).includes(room);
}
