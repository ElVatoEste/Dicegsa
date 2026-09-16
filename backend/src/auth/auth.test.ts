import { describe, expect, test } from 'bun:test';
import { puedeAcceder, RUTA_CAMBIO_PASSWORD, type TokenPayload } from './acceso';
import {
  generarPasswordInicial,
  hashear,
  LARGO_MINIMO,
  normalizarNombreCuenta,
  passwordAceptable,
  verificar,
} from './passwords';
import { puedeEscuchar, salasPara } from '../eventos/salas';

const base: TokenPayload = {
  sub: 'id',
  nombreCuenta: 'jlopez',
  rol: 'operario',
  debeCambiarPassword: false,
};

describe('puerta de primer ingreso', () => {
  test('con la contraseña ya cambiada se llega a cualquier ruta', () => {
    expect(puedeAcceder(base, '/cuentas')).toBe(true);
    expect(puedeAcceder(base, '/auth/me')).toBe(true);
  });

  test('con contraseña de un solo uso solo se llega al cambio', () => {
    const pendiente = { ...base, debeCambiarPassword: true };
    expect(puedeAcceder(pendiente, RUTA_CAMBIO_PASSWORD)).toBe(true);
    expect(puedeAcceder(pendiente, '/auth/password/')).toBe(true);
    expect(puedeAcceder(pendiente, '/auth/password?x=1')).toBe(true);
    expect(puedeAcceder(pendiente, '/auth/me')).toBe(false);
    expect(puedeAcceder(pendiente, '/cuentas')).toBe(false);
  });

  test('un admin con contraseña de un solo uso tampoco pasa', () => {
    const admin = { ...base, rol: 'admin' as const, debeCambiarPassword: true };
    expect(puedeAcceder(admin, '/cuentas')).toBe(false);
  });
});

describe('contraseñas', () => {
  test('la generada evita caracteres que se confunden al teclear', () => {
    for (let i = 0; i < 200; i++) {
      expect(generarPasswordInicial()).not.toMatch(/[O0Il1]/);
    }
  });

  test('la generada tiene el largo pedido y no se repite', () => {
    expect(generarPasswordInicial()).toHaveLength(10);
    expect(generarPasswordInicial(16)).toHaveLength(16);
    const muestras = new Set(Array.from({ length: 100 }, () => generarPasswordInicial()));
    expect(muestras.size).toBe(100);
  });

  test('la generada pasa el mínimo que exige el cambio', () => {
    expect(passwordAceptable(generarPasswordInicial())).toBe(true);
  });

  test('el mínimo es largo y nada más', () => {
    expect(passwordAceptable('a'.repeat(LARGO_MINIMO))).toBe(true);
    expect(passwordAceptable('a'.repeat(LARGO_MINIMO - 1))).toBe(false);
  });

  test('el hash es argon2id y verifica de ida y vuelta', async () => {
    const hash = await hashear('bodega-2026');
    expect(hash).toStartWith('$argon2id$');
    expect(hash).not.toContain('bodega-2026');
    expect(await verificar('bodega-2026', hash)).toBe(true);
    expect(await verificar('bodega-2025', hash)).toBe(false);
  });
});

describe('nombre de cuenta', () => {
  test('no distingue mayúsculas ni espacios al borde', () => {
    expect(normalizarNombreCuenta('  JLopez ')).toBe('jlopez');
    expect(normalizarNombreCuenta('JLOPEZ')).toBe(normalizarNombreCuenta('jlopez'));
  });
});

describe('salas de eventos', () => {
  test('el admin escucha tablero y cuentas', () => {
    expect(salasPara('admin')).toEqual(['tablero', 'cuentas']);
  });

  test('supervisión y gerencia escuchan el tablero, no las cuentas', () => {
    for (const rol of ['supervisor', 'gerencia'] as const) {
      expect(salasPara(rol)).toEqual(['tablero']);
      expect(puedeEscuchar(rol, 'cuentas')).toBe(false);
    }
  });

  test('el operario no escucha el tablero completo', () => {
    expect(salasPara('operario')).toEqual([]);
    expect(puedeEscuchar('operario', 'tablero')).toBe(false);
    expect(puedeEscuchar('operario', 'cuentas')).toBe(false);
  });
});
