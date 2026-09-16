export type RolSistema = 'operario' | 'supervisor' | 'gerencia' | 'admin';

export interface TokenPayload {
  sub: string;
  nombreCuenta: string;
  rol: RolSistema;
  debeCambiarPassword: boolean;
}

/** Única ruta alcanzable mientras la contraseña siga siendo la de un solo uso. */
export const RUTA_CAMBIO_PASSWORD = '/auth/password';

/**
 * Una cuenta con contraseña de un solo uso no llega a ninguna otra ruta hasta
 * cambiarla. Sin esta puerta, la credencial que el administrador entregó en mano
 * queda vigente y conocida por dos personas.
 */
export function puedeAcceder(payload: TokenPayload, ruta: string): boolean {
  if (!payload.debeCambiarPassword) return true;
  return normalizarRuta(ruta) === RUTA_CAMBIO_PASSWORD;
}

function normalizarRuta(ruta: string): string {
  const sinQuery = ruta.split('?')[0]!;
  return sinQuery.length > 1 ? sinQuery.replace(/\/+$/, '') : sinQuery;
}
