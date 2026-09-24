'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';
import { useRealtime, type RealtimeEvent } from './events';
import { useToast } from '@/components/Toasts';

/**
 * Carga un recurso y lo vuelve a pedir cuando llega un evento que le importa.
 * `data` es null solo hasta la primera respuesta, así la pantalla distingue
 * "cargando" de "vacío". Cuando cambia `key` (un período, un filtro del
 * servidor) se vuelve a pedir.
 */
export function useLive<T>(
  token: string | undefined,
  load: (token: string) => Promise<T>,
  relevant: (event: RealtimeEvent) => boolean = () => true,
  key = '',
) {
  const [data, setData] = useState<T | null>(null);
  const toast = useToast();
  const loader = useRef(load);
  loader.current = load;

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setData(await loader.current(token));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo cargar la información');
    }
    // toast viene de un contexto estable; incluirlo rearmaría el efecto en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const connection = useRealtime(token, (event) => {
    if (relevant(event)) void reload();
  });

  return { data, reload, connection, setData };
}

/**
 * Corre una acción del usuario con aviso de error y estado de ocupado. Devuelve
 * true si salió bien, para que quien llama decida si cierra un panel.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const run = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      setBusy(true);
      try {
        await action();
        if (success) toast.success(success);
        return true;
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'No se pudo completar la operación');
        return false;
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { busy, run };
}
