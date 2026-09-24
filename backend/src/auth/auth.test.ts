import { describe, expect, test } from 'bun:test';
import { canAccess, PASSWORD_ROUTE, type TokenPayload } from './access';
import {
  generateInitialPassword,
  hashPassword,
  isPasswordAcceptable,
  MIN_LENGTH,
  normalizeAccountName,
  verifyPassword,
} from './passwords';
import { canListen, roomsFor } from '../events/rooms';

const base: TokenPayload = {
  sub: 'id',
  accountName: 'jlopez',
  role: 'operator',
  mustChangePassword: false,
};

describe('puerta de primer ingreso', () => {
  test('con la contraseña ya cambiada se llega a cualquier ruta', () => {
    expect(canAccess(base, '/accounts')).toBe(true);
    expect(canAccess(base, '/auth/me')).toBe(true);
  });

  test('con contraseña de un solo uso solo se llega al cambio', () => {
    const pending = { ...base, mustChangePassword: true };
    expect(canAccess(pending, PASSWORD_ROUTE)).toBe(true);
    expect(canAccess(pending, '/auth/password/')).toBe(true);
    expect(canAccess(pending, '/auth/password?x=1')).toBe(true);
    expect(canAccess(pending, '/auth/me')).toBe(false);
    expect(canAccess(pending, '/accounts')).toBe(false);
  });

  test('un admin con contraseña de un solo uso tampoco pasa', () => {
    const admin = { ...base, role: 'admin' as const, mustChangePassword: true };
    expect(canAccess(admin, '/accounts')).toBe(false);
  });
});

describe('contraseñas', () => {
  test('la generada evita caracteres que se confunden al teclear', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInitialPassword()).not.toMatch(/[O0Il1]/);
    }
  });

  test('la generada tiene el largo pedido y no se repite', () => {
    expect(generateInitialPassword()).toHaveLength(10);
    expect(generateInitialPassword(16)).toHaveLength(16);
    const samples = new Set(Array.from({ length: 100 }, () => generateInitialPassword()));
    expect(samples.size).toBe(100);
  });

  test('la generada pasa el mínimo que exige el cambio', () => {
    expect(isPasswordAcceptable(generateInitialPassword())).toBe(true);
  });

  test('el mínimo es largo y nada más', () => {
    expect(isPasswordAcceptable('a'.repeat(MIN_LENGTH))).toBe(true);
    expect(isPasswordAcceptable('a'.repeat(MIN_LENGTH - 1))).toBe(false);
  });

  test('el hash es argon2id y verifica de ida y vuelta', async () => {
    const hash = await hashPassword('bodega-2026');
    expect(hash).toStartWith('$argon2id$');
    expect(hash).not.toContain('bodega-2026');
    expect(await verifyPassword('bodega-2026', hash)).toBe(true);
    expect(await verifyPassword('bodega-2025', hash)).toBe(false);
  });
});

describe('nombre de cuenta', () => {
  test('no distingue mayúsculas ni espacios al borde', () => {
    expect(normalizeAccountName('  JLopez ')).toBe('jlopez');
    expect(normalizeAccountName('JLOPEZ')).toBe(normalizeAccountName('jlopez'));
  });
});

describe('salas de eventos', () => {
  test('el admin escucha el tablero y las cuentas', () => {
    expect(roomsFor('admin')).toEqual(['board', 'accounts']);
  });

  test('supervisión y gerencia escuchan el tablero, no las cuentas', () => {
    for (const role of ['supervisor', 'management'] as const) {
      expect(roomsFor(role)).toEqual(['board']);
      expect(canListen(role, 'accounts')).toBe(false);
    }
  });

  test('el operario no escucha el tablero completo', () => {
    expect(roomsFor('operator')).toEqual([]);
    expect(canListen('operator', 'board')).toBe(false);
    expect(canListen('operator', 'accounts')).toBe(false);
  });
});
