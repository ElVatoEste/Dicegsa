'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, SystemRole } from '@/lib/api';
import { readSession } from '@/lib/session';

/**
 * Deja pasar solo a una sesión con la contraseña ya elegida y con uno de los roles
 * permitidos. Devuelve `null` mientras lee localStorage: sin esa espera, la pantalla
 * mandaría al login a alguien que sí está autenticado.
 *
 * Es una barrera de interfaz, no de seguridad: quien manda es el guardia del API.
 */
export function useAuthGuard(allowedRoles?: SystemRole[]): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace('/');
      return;
    }
    if (current.mustChangePassword) {
      router.replace('/cambiar-password/');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(current.role)) {
      router.replace('/');
      return;
    }
    setSession(current);
    // allowedRoles llega como literal en cada pantalla; no cambia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}
