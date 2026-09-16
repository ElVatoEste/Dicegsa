'use client';

import type { SystemRole } from '@/lib/api';
import { NavContent } from './NavContent';

/** Barra fija de escritorio. En pantallas chicas manda MobileNav. */
export function Sidebar({
  role,
  accountName,
  path,
}: {
  role: SystemRole;
  accountName?: string;
  path: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-indigo-800 md:flex">
      <NavContent role={role} accountName={accountName} path={path} />
    </aside>
  );
}
