import type { SystemRole } from './api';
import type { AdminAction } from './api';

export const ROLES: SystemRole[] = ['operator', 'supervisor', 'management', 'admin'];

export const ROLE_LABEL: Record<SystemRole, string> = {
  operator: 'Operario',
  supervisor: 'Supervisor',
  management: 'Gerencia',
  admin: 'Administrador',
};

/** Cada acción se lee como frase, para que el registro se recorra de corrido. */
export const ACTION_LABEL: Record<AdminAction, string> = {
  create: 'creó la cuenta',
  reset_password: 'reinició la contraseña de',
  change_role: 'cambió el rol de',
  deactivate: 'dio de baja a',
  reactivate: 'reactivó a',
};

/** Las claves del detalle vienen del backend en inglés y se muestran en español. */
export const DETAIL_LABEL: Record<string, string> = {
  role: 'rol',
  from: 'de',
  to: 'a',
};
