'use client';

import { Menu } from 'lucide-react';
import { Logo } from './Logo';

/** Encabezado de móvil: abre la navegación. */
export function Topbar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 md:hidden">
      <button
        onClick={onOpen}
        aria-label="Abrir navegación"
        className="rounded-lg p-2 text-muted hover:bg-canvas"
      >
        <Menu size={18} />
      </button>
      <Logo />
    </header>
  );
}
