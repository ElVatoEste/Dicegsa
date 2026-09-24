'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { SystemRole } from '@/lib/api';
import type { ConnectionState } from '@/lib/events';
import { NavContent } from './NavContent';

export function MobileNav({
  open,
  onClose,
  role,
  accountName,
  path,
  connection,
}: {
  open: boolean;
  onClose: () => void;
  role: SystemRole;
  accountName?: string;
  path: string;
  connection?: ConnectionState;
}) {
  // Escape cierra el panel: quien lo abrió sin querer no queda atrapado.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-brand-950/50" onClick={onClose} aria-hidden />
      <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-brand-950">
        <button
          onClick={onClose}
          aria-label="Cerrar navegación"
          className="absolute right-3 top-5 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <NavContent role={role} accountName={accountName} path={path} connection={connection} />
      </aside>
    </div>
  );
}
