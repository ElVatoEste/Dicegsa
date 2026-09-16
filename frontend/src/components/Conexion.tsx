'use client';

import type { EstadoConexion } from '@/lib/eventos';

const ROTULO: Record<EstadoConexion, { texto: string; clase: string }> = {
  'en-vivo': { texto: 'En vivo', clase: 'bg-accion' },
  conectando: { texto: 'Conectando', clase: 'bg-aviso animate-pulse' },
  'sin-conexion': { texto: 'Sin conexión', clase: 'bg-alerta' },
};

/** Sin este indicador un tablero congelado es indistinguible de un almacén tranquilo. */
export function Conexion({ estado }: { estado: EstadoConexion }) {
  const { texto, clase } = ROTULO[estado];
  return (
    <span className="flex items-center gap-2 text-xs text-tinta-suave" role="status">
      <span className={`size-2 rounded-full ${clase}`} aria-hidden />
      {texto}
    </span>
  );
}
