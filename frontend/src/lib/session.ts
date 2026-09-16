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
