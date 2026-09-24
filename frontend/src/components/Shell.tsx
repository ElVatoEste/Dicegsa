'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SystemRole } from '@/lib/api';
import type { ConnectionState } from '@/lib/events';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageHeader } from './ui';
import { cn } from '@/lib/cn';

/** Arma la pantalla: navegación a la izquierda, encabezado y contenido a la derecha. */
export function Shell({
  title,
  subtitle,
  role,
  accountName,
  connection,
  actions,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  role: SystemRole;
  accountName?: string;
  /** Estado de la conexión en vivo; se muestra en la navegación. */
  connection?: ConnectionState;
  actions?: React.ReactNode;
  /** Ocupa todo el ancho disponible, para vistas como el tablero. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Al navegar desde el panel de móvil, el panel se cierra solo.
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#contenido"
        className="fixed left-3 top-3 z-[80] -translate-y-20 rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-medium text-white transition-[translate] duration-150 focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <Sidebar role={role} accountName={accountName} path={path} connection={connection} />
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        accountName={accountName}
        path={path}
        connection={connection}
      />

      <div className="min-w-0 flex-1">
        <Topbar onOpen={() => setOpen(true)} />
        <main id="contenido" tabIndex={-1} className={cn('entra mx-auto outline-none px-5 py-8 md:px-10 md:py-10', wide ? 'max-w-[112rem]' : 'max-w-6xl')}>
          <PageHeader title={title} subtitle={subtitle} actions={actions} />
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
