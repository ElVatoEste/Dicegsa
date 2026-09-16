'use client';

import { useEffect, useState } from 'react';
import type { RolSistema, Sesion } from './api';

const CLAVE = 'dicegsa.sesion';

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
}

export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    return null;
  }
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE);
}

/**
 * La sesión vive en localStorage, que solo existe después de montar el componente.
 * `cargando` distingue "todavía no se leyó" de "no hay sesión", para no mandar al
 * login a alguien que sí está autenticado.
 */
export function useSesion(rolesPermitidos?: RolSistema[]) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const actual = leerSesion();
    setSesion(actual);
    setCargando(false);

    if (!actual) {
      window.location.href = '/';
      return;
    }
    if (actual.debeCambiarPassword) {
      window.location.href = '/cambiar-password/';
      return;
    }
    if (rolesPermitidos && !rolesPermitidos.includes(actual.rol)) {
      window.location.href = '/';
    }
    // rolesPermitidos se pasa como literal en cada pantalla; no cambia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sesion, cargando };
}
