import type { AdminAction, FloorRole, SystemRole } from './api';

export const ROLES: SystemRole[] = ['operator', 'supervisor', 'management', 'admin'];

export const ROLE_LABEL: Record<SystemRole, string> = {
  operator: 'Operario',
  supervisor: 'Supervisor',
  management: 'Gerencia',
  admin: 'Administrador',
};

export const FLOOR_ROLES: FloorRole[] = ['picker', 'checker'];

export const FLOOR_ROLE_LABEL: Record<FloorRole, string> = {
  picker: 'Alistador',
  checker: 'Validador',
};

/** Cada acción se lee como frase, para que el registro se recorra de corrido. */
export const ACTION_LABEL: Record<AdminAction, string> = {
  create: 'creó la cuenta',
  reset_password: 'reinició la contraseña de',
  change_role: 'cambió el rol de',
  deactivate: 'dio de baja a',
  reactivate: 'reactivó a',
  update_worker: 'editó el perfil de',
};

/** Las claves del detalle vienen del backend en inglés y se muestran en español. */
export const DETAIL_LABEL: Record<string, string> = {
  role: 'rol',
  from: 'de',
  to: 'a',
  fullName: 'nombre',
  floorRole: 'en el piso',
};

/** Los valores del detalle que son enums del backend también se muestran traducidos. */
export function detailValue(value: string): string {
  return ROLE_LABEL[value as SystemRole] ?? FLOOR_ROLE_LABEL[value as FloorRole] ?? value;
}
