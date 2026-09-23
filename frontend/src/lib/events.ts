'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

export type Room = 'accounts' | 'board' | 'personal';

export interface RealtimeEvent<T = unknown> {
  type: string;
  room: Room;
  data: T;
  /** Instante del servidor en ISO 8601; el reloj del cliente no interviene. */
  emittedAt: string;
}

export type ConnectionState = 'connecting' | 'live' | 'offline';

/**
 * Escucha los eventos que el servidor emite para las salas del rol de la cuenta.
 * El manejador se guarda en una referencia para que cambiarlo entre renders no
 * rearme la conexión.
 *
 * El servidor corta la conexión si el token no verifica o si la contraseña sigue
 * siendo la de un solo uso.
 */
export function useRealtime(token: string | undefined, onEvent: (event: RealtimeEvent) => void) {
  const [state, setState] = useState<ConnectionState>('connecting');
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => setState('connecting'));
    socket.on('ready', () => setState('live'));
    socket.on('disconnect', () => setState('offline'));
    socket.on('connect_error', () => setState('offline'));
    socket.on('event', (event: RealtimeEvent) => handler.current(event));

    return () => {
      socket.close();
    };
  }, [token]);

  return state;
}
