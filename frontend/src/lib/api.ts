const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7300';

export type RolSistema = 'operario' | 'supervisor' | 'gerencia' | 'admin';

export interface Sesion {
  token: string;
  rol: RolSistema;
  debeCambiarPassword: boolean;
}

export interface Cuenta {
  id: string;
  nombreCuenta: string;
  rol: RolSistema;
  activa: boolean;
  debeCambiarPassword: boolean;
  creadaEn: string;
  actualizadaEn: string;
}

export interface EventoAdmin {
  id: string;
  actorId: string;
  cuentaObjetivoId: string;
  accion: 'alta' | 'reseteo' | 'cambio_rol' | 'baja' | 'reactivacion';
  detalle: Record<string, string> | null;
  creadoEn: string;
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}, token?: string): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      // Solo cuando hay cuerpo: Fastify rechaza un POST que declara JSON y llega vacío,
      // y varias acciones de cuentas (reseteo, baja, reactivación) no mandan nada.
      ...(opciones.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi(respuesta.status, cuerpo?.message ?? 'No se pudo completar la operación');
  }
  return respuesta.status === 204 ? (undefined as T) : respuesta.json();
}

export const api = {
  login: (nombreCuenta: string, password: string) =>
    pedir<Sesion>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombreCuenta, password }),
    }),

  cambiarPassword: (token: string, passwordActual: string, passwordNueva: string) =>
    pedir<{ token: string }>(
      '/auth/password',
      { method: 'POST', body: JSON.stringify({ passwordActual, passwordNueva }) },
      token,
    ),

  cuentas: (token: string) => pedir<Cuenta[]>('/cuentas', {}, token),

  crearCuenta: (token: string, nombreCuenta: string, rol: RolSistema) =>
    pedir<{ cuenta: Cuenta; passwordInicial: string }>(
      '/cuentas',
      { method: 'POST', body: JSON.stringify({ nombreCuenta, rol }) },
      token,
    ),

  resetear: (token: string, id: string) =>
    pedir<{ cuenta: Cuenta; passwordInicial: string }>(
      `/cuentas/${id}/reseteo`,
      { method: 'POST' },
      token,
    ),

  cambiarRol: (token: string, id: string, rol: RolSistema) =>
    pedir<Cuenta>(`/cuentas/${id}/rol`, { method: 'PATCH', body: JSON.stringify({ rol }) }, token),

  cambiarEstado: (token: string, id: string, activa: boolean) =>
    pedir<Cuenta>(`/cuentas/${id}/${activa ? 'reactivacion' : 'baja'}`, { method: 'POST' }, token),

  auditoria: (token: string) => pedir<EventoAdmin[]>('/cuentas/auditoria', {}, token),
};
