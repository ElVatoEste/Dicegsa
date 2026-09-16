'use client';

import { LogOut } from 'lucide-react';
import type { SystemRole } from '@/lib/api';
import { cn } from '@/lib/cn';
import { ROLE_LABEL } from '@/lib/labels';
import { isActiveRoute, navGroupsFor } from '@/lib/nav';
import { clearSession } from '@/lib/session';
import { Logo } from './Logo';

/**
 * Contenido de la navegación. Lo comparten la barra fija de escritorio y el panel
 * deslizante de móvil, para que no se dupliquen los enlaces ni los permisos.
 */
export function NavContent({
  role,
  accountName,
  path,
}: {
  role: SystemRole;
  accountName?: string;
  path: string;
}) {
  return (
    <>
      <div className="px-5 py-5">
        <Logo tone="dark" />
      </div>

      <nav className="scroll-tenue flex-1 overflow-y-auto px-3 py-2">
        {navGroupsFor(role).map(({ title, items }) => (
          <div key={title} className="mb-5">
            <p className="px-3 pb-2 text-xs font-medium text-white/40">{title}</p>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActiveRoute(path, href);
                return (
                  <a
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-white/12 text-white'
                        : 'text-white/65 hover:bg-white/8 hover:text-white',
                    )}
                  >
                    <Icon size={17} aria-hidden className={active ? 'text-cyan-300' : undefined} />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {accountName && (
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-500 text-xs font-semibold text-indigo-900">
              {accountName.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{accountName}</span>
              <span className="block text-xs text-white/50">{ROLE_LABEL[role]}</span>
            </span>
          </div>
        )}
        <button
          onClick={() => {
            clearSession();
            window.location.href = '/';
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition-colors duration-150 hover:bg-white/8 hover:text-white"
        >
          <LogOut size={17} aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
