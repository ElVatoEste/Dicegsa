import { ClipboardList, ScrollText, Users, type LucideIcon } from 'lucide-react';
import type { SystemRole } from './api';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: SystemRole[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: 'Operación',
    items: [
      {
        href: '/tablero/',
        label: 'Tablero',
        icon: ClipboardList,
        roles: ['supervisor', 'management', 'admin'],
      },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/cuentas/', label: 'Cuentas', icon: Users, roles: ['admin'] },
      { href: '/auditoria/', label: 'Auditoría', icon: ScrollText, roles: ['admin'] },
    ],
  },
];

/** Grupos visibles para el rol. Un grupo sin items alcanzables no se muestra. */
export function navGroupsFor(role: SystemRole): NavGroup[] {
  return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter(
    (g) => g.items.length > 0,
  );
}

export function isActiveRoute(path: string, href: string): boolean {
  return path === href || path === href.replace(/\/$/, '');
}
