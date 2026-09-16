'use client';

import { ClipboardList, LogOut, ScrollText, Users } from 'lucide-react';
import { borrarSesion } from '@/lib/sesion';
import type { RolSistema } from '@/lib/api';

const SECCIONES = [
  { href: '/tablero/', etiqueta: 'Tablero', icono: ClipboardList, roles: ['supervisor', 'gerencia', 'admin'] },
  { href: '/cuentas/', etiqueta: 'Cuentas', icono: Users, roles: ['admin'] },
  { href: '/auditoria/', etiqueta: 'Auditoría', icono: ScrollText, roles: ['admin'] },
] as const;

export function Marco({
  titulo,
  descripcion,
  rol,
  children,
}: {
  titulo: string;
  descripcion?: string;
  rol: RolSistema;
  children: React.ReactNode;
}) {
  const visibles = SECCIONES.filter((s) => (s.roles as readonly string[]).includes(rol));
  const actual = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className="min-h-screen">
      <header className="border-b border-linea bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3">
          <span className="text-sm font-semibold tracking-tight">CDF</span>
          <nav className="flex gap-1">
            {visibles.map(({ href, etiqueta, icono: Icono }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  actual === href
                    ? 'bg-accion-suave font-medium text-accion'
                    : 'text-tinta-suave hover:bg-fondo hover:text-tinta'
                }`}
              >
                <Icono size={16} aria-hidden />
                {etiqueta}
              </a>
            ))}
          </nav>
          <button
            onClick={() => {
              borrarSesion();
              window.location.href = '/';
            }}
            className="ml-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-tinta-suave transition-colors hover:bg-fondo hover:text-tinta"
          >
            <LogOut size={16} aria-hidden />
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-tinta-suave">{descripcion}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
