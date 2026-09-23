export type SystemRole =
  | 'operator'
  | 'validator'
  | 'control_desk'
  | 'supervisor'
  | 'management'
  | 'admin';

export interface TokenPayload {
  sub: string;
  accountName: string;
  role: SystemRole;
  mustChangePassword: boolean;
}

/** Única ruta alcanzable mientras la contraseña siga siendo la de un solo uso. */
export const PASSWORD_ROUTE = '/auth/password';

/**
 * Una cuenta con contraseña de un solo uso no llega a ninguna otra ruta hasta
 * cambiarla. Sin esta puerta, la credencial que el administrador entregó en mano
 * queda vigente y conocida por dos personas.
 */
export function canAccess(payload: TokenPayload, route: string): boolean {
  if (!payload.mustChangePassword) return true;
  return normalize(route) === PASSWORD_ROUTE;
}

function normalize(route: string): string {
  const withoutQuery = route.split('?')[0]!;
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
}
