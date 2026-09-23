import { describe, expect, test } from 'bun:test';
import { afterValidation, canDeliver, canReassign, isWorkable, orderStatus } from './rules';

describe('estado del pedido', () => {
  test('una baja manda sobre cualquier estado del PKL', () => {
    expect(orderStatus(true, 'picking')).toBe('cancelled');
    expect(orderStatus(true, null)).toBe('cancelled');
  });

  test('sin PKL el pedido está sin asignar', () => {
    expect(orderStatus(false, null)).toBe('unassigned');
  });

  test('asignado, en alisto o devuelto se ve como en preparación', () => {
    expect(orderStatus(false, 'assigned')).toBe('in_progress');
    expect(orderStatus(false, 'picking')).toBe('in_progress');
    expect(orderStatus(false, 'returned')).toBe('in_progress');
  });

  test('validación y cierre pasan tal cual', () => {
    expect(orderStatus(false, 'validating')).toBe('validating');
    expect(orderStatus(false, 'done')).toBe('done');
  });
});

describe('entrega a validación', () => {
  test('con todas las líneas alistadas o dadas de baja se entrega', () => {
    expect(canDeliver(['picked', 'picked'])).toBe(true);
    expect(canDeliver(['picked', 'cancelled'])).toBe(true);
  });

  test('una línea pendiente o no encontrada frena la entrega', () => {
    expect(canDeliver(['picked', 'pending'])).toBe(false);
    expect(canDeliver(['picked', 'not_found'])).toBe(false);
  });

  test('un PKL sin líneas no se entrega', () => {
    expect(canDeliver([])).toBe(false);
  });
});

describe('validación y reasignación', () => {
  test('con errores vuelve al alistador, sin errores termina', () => {
    expect(afterValidation(2)).toBe('returned');
    expect(afterValidation(0)).toBe('done');
  });

  test('solo se trabaja y reasigna antes de validación', () => {
    expect(isWorkable('returned')).toBe(true);
    expect(isWorkable('validating')).toBe(false);
    expect(canReassign('picking')).toBe(true);
    expect(canReassign('validating')).toBe(false);
    expect(canReassign('done')).toBe(false);
  });
});
