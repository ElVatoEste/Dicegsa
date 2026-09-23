'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SystemRole } from '@/lib/api';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageHeader } from './ui';

/** Arma la pantalla: navegación a la izquierda, encabezado y contenido a la derecha. */
export function Shell({
  title,
  subtitle,
  role,
  accountName,
  status,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  role: SystemRole;
  accountName?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Al navegar desde el panel de móvil, el panel se cierra solo.
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} accountName={accountName} path={path} />
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        accountName={accountName}
        path={path}
      />

      <div className="min-w-0 flex-1">
        <Topbar onOpen={() => setOpen(true)} status={status} />
        <main className="entra mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10">
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={
              <>
                <span className="hidden md:block">{status}</span>
                {actions}
              </>
            }
          />
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
