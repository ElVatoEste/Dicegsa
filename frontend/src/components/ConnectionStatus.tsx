'use client';

import type { ConnectionState } from '@/lib/events';

const LABEL: Record<ConnectionState, { text: string; dot: string }> = {
  live: { text: 'En vivo', dot: 'bg-brand-500' },
  connecting: { text: 'Conectando', dot: 'bg-warning animate-pulse' },
  offline: { text: 'Sin conexión', dot: 'bg-danger' },
};

/** Sin este indicador un tablero congelado es indistinguible de un almacén tranquilo. */
export function ConnectionStatus({ state }: { state: ConnectionState }) {
  const { text, dot } = LABEL[state];
  return (
    <span className="flex items-center gap-2 text-xs text-muted" role="status">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {text}
    </span>
  );
}
