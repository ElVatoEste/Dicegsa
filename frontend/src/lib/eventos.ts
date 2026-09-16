'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7300';

export type Sala = 'cuentas' | 'tablero';

export interface Evento<T = unknown> {
  tipo: string;
  sala: Sala;
  datos: T;
  /** Instante del servidor en ISO 8601; el reloj del cliente no interviene. */
  emitidoEn: string;
}

export type EstadoConexion = 'conectando' | 'en-vivo' | 'sin-conexion';

/**
 * Escucha los eventos que el servidor emite para las salas del rol de la cuenta.
 * `al` se guarda en una referencia para que cambiar el manejador entre renders no
 * rearme la conexión.
 *
 * El servidor corta la conexión si el token no verifica o si la contraseña sigue
 * siendo la de un solo uso.
 */
export function useEventos(token: string | undefined, al: (evento: Evento) => void) {
  const [estado, setEstado] = useState<EstadoConexion>('conectando');
  const manejador = useRef(al);
  manejador.current = al;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(BASE, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => setEstado('conectando'));
    socket.on('listo', () => setEstado('en-vivo'));
    socket.on('disconnect', () => setEstado('sin-conexion'));
    socket.on('connect_error', () => setEstado('sin-conexion'));
    socket.on('evento', (evento: Evento) => manejador.current(evento));

    return () => {
      socket.close();
    };
  }, [token]);

  return estado;
}
