'use client';

import type { Session } from './api';

const KEY = 'dicegsa.session';

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

const REMEMBERED = 'dicegsa.account';

/**
 * Recuerda solo el nombre de cuenta, nunca la contraseña ni la sesión: en una
 * computadora compartida, quien llega después no puede entrar como el anterior.
 */
export function rememberAccount(accountName: string | null) {
  try {
    if (accountName) localStorage.setItem(REMEMBERED, accountName);
    else localStorage.removeItem(REMEMBERED);
  } catch {
    // Sin almacenamiento disponible el formulario simplemente no recuerda nada.
  }
}

export function rememberedAccount(): string {
  try {
    return localStorage.getItem(REMEMBERED) ?? '';
  } catch {
    return '';
  }
}
