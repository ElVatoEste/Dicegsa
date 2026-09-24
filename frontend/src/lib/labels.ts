import type {
  AdminAction,
  CatalogKind,
  FloorRole,
  LineStatus,
  OrderStatus,
  SystemRole,
} from './api';

export const ROLES: SystemRole[] = [
  'operator',
  'validator',
  'control_desk',
  'supervisor',
  'management',
  'admin',
];

export const ROLE_LABEL: Record<SystemRole, string> = {
  operator: 'Alistador',
  validator: 'Validador',
  control_desk: 'Mesa de control',
  supervisor: 'Supervisor',
  management: 'Gerencia',
  admin: 'Administrador',
};

/** Roles que trabajan en el piso y llevan perfil de colaborador. */
export const FLOOR_ACCOUNT_ROLES: SystemRole[] = ['operator', 'validator'];

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

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  unassigned: 'Sin asignar',
  in_progress: 'En preparación',
  validating: 'En validación',
  done: 'Finalizado',
  cancelled: 'Dado de baja',
};

export const LINE_STATUS_LABEL: Record<LineStatus, string> = {
  pending: 'Pendiente',
  picked: 'Alistada',
  not_found: 'No encontrada',
  cancelled: 'Dada de baja',
};

export const CATALOG_LABEL: Record<CatalogKind, { title: string; one: string; hint: string }> = {
  dispatch_zone: {
    title: 'Zonas de despacho',
    one: 'zona de despacho',
    hint: 'A dónde va el pedido. Mesa de control la asigna a cada pedido.',
  },
  inventory_zone: {
    title: 'Zonas de inventario',
    one: 'zona de inventario',
    hint: 'Área del almacén de donde sale el pedido. Orienta a qué alistadores asignarlo.',
  },
  error_type: {
    title: 'Tipos de error',
    one: 'tipo de error',
    hint: 'Lo que el validador puede registrar al revisar un PKL.',
  },
};
