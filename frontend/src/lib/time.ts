'use client';

import { useEffect, useState } from 'react';

const DATE_TIME = new Intl.DateTimeFormat('es-NI', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const DAY = new Intl.DateTimeFormat('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** Fecha de vencimiento de un lote. Llega como día sin hora y se lee en UTC para no correrse. */
export function formatDay(day: string): string {
  return DAY.format(new Date(`${day}T12:00:00Z`));
}

/**
 * Tiempo que falta hasta un instante, en la unidad que se lee de un vistazo.
 * En negativo, lo que pasó desde el vencimiento.
 */
export function formatRemaining(ms: number): string {
  const late = ms < 0;
  const minutes = Math.floor(Math.abs(ms) / 60000);
  let text: string;
  if (minutes < 1) text = 'menos de 1 min';
  else if (minutes < 60) text = `${minutes} min`;
  else if (minutes < 60 * 24) text = `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  else text = `${Math.floor(minutes / 1440)} d ${Math.floor((minutes % 1440) / 60)} h`;
  return late ? `vencido hace ${text}` : `en ${text}`;
}

/** Cronómetro en horas, minutos y segundos. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Hora actual que se renueva cada `intervalMs`. Los contadores de vencimiento no
 * necesitan segundos; los cronómetros sí.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Valor para un `<input type="datetime-local">` en la hora local del equipo. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
