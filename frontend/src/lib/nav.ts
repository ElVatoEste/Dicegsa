import { ChartColumn, ClipboardCheck, PackageSearch, ScrollText, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react';
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
        href: '/pedidos/',
        label: 'Pedidos',
        icon: PackageSearch,
        roles: ['control_desk', 'supervisor', 'management', 'admin'],
      },
      {
        href: '/validacion/',
        label: 'Validación',
        icon: ClipboardCheck,
        roles: ['validator', 'supervisor', 'admin'],
      },
      {
        href: '/metricas/',
        label: 'Métricas',
        icon: ChartColumn,
        roles: ['supervisor', 'management', 'admin'],
      },
    ],
  },
  {
    title: 'Administración',
    items: [
      {
        href: '/configuracion/',
        label: 'Configuración',
        icon: SlidersHorizontal,
        roles: ['supervisor', 'management', 'admin'],
      },
      { href: '/cuentas/', label: 'Cuentas', icon: Users, roles: ['admin'] },
      { href: '/auditoria/', label: 'Auditoría', icon: ScrollText, roles: ['admin'] },
    ],
  },
];

/**
 * Pantalla de entrada después del ingreso. El alistador entra a su vista;
 * el resto, a la primera pantalla que su rol alcanza.
 */
export function homeFor(role: SystemRole): string {
  if (role === 'operator') return '/operario/';
  return navGroupsFor(role)[0]?.items[0]?.href ?? '/';
}

/** Grupos visibles para el rol. Un grupo sin items alcanzables no se muestra. */
export function navGroupsFor(role: SystemRole): NavGroup[] {
  return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter(
    (g) => g.items.length > 0,
  );
}

export function isActiveRoute(path: string, href: string): boolean {
  return path === href || path === href.replace(/\/$/, '');
}
