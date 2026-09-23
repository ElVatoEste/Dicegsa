export type PickListStatus = 'assigned' | 'picking' | 'validating' | 'returned' | 'done';
export type LineStatus = 'pending' | 'picked' | 'not_found' | 'cancelled';
export type OrderStatus = 'unassigned' | 'in_progress' | 'validating' | 'done' | 'cancelled';

/**
 * Estado del pedido tal como lo ve mesa de control. Se deriva del PKL que lo
 * contiene en lugar de guardarse aparte, para que los dos no puedan contradecirse.
 */
export function orderStatus(cancelled: boolean, pickList: PickListStatus | null): OrderStatus {
  if (cancelled) return 'cancelled';
  if (!pickList) return 'unassigned';
  if (pickList === 'validating') return 'validating';
  if (pickList === 'done') return 'done';
  return 'in_progress';
}

/** El alistador trabaja un PKL mientras está en preparación o de vuelta por errores. */
export function isWorkable(status: PickListStatus): boolean {
  return status === 'assigned' || status === 'picking' || status === 'returned';
}

/**
 * Se entrega a validación cuando cada línea está alistada o dada de baja. Una línea
 * no encontrada frena la entrega hasta que inventario la encuentre o televentas la
 * dé de baja.
 */
export function canDeliver(lines: LineStatus[]): boolean {
  return lines.length > 0 && lines.every((s) => s === 'picked' || s === 'cancelled');
}

/** Con errores el PKL vuelve al mismo alistador; sin errores su ciclo termina. */
export function afterValidation(errorCount: number): PickListStatus {
  return errorCount > 0 ? 'returned' : 'done';
}

/** Se reasigna mientras no haya llegado a validación. */
export function canReassign(status: PickListStatus): boolean {
  return isWorkable(status);
}
