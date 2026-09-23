import { api, PATHS } from '../client';

export type CatalogKind = 'dispatch_zone' | 'inventory_zone' | 'error_type';

export interface CatalogEntry {
  id: string;
  kind: CatalogKind;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Settings {
  /** Minutos antes de la entrega a partir de los cuales un pedido es de pronta entrega. */
  urgentThresholdMinutes: number;
}

export const catalogsApi = {
  list: (token: string, kind: CatalogKind) =>
    api.get<CatalogEntry[]>(PATHS.catalogs.root(kind), { token }),

  create: (token: string, kind: CatalogKind, name: string) =>
    api.post<CatalogEntry>(PATHS.catalogs.root(kind), { name }, { token }),

  setActive: (token: string, kind: CatalogKind, id: string, active: boolean) =>
    api.post<CatalogEntry>(
      active ? PATHS.catalogs.reactivate(kind, id) : PATHS.catalogs.deactivate(kind, id),
      undefined,
      { token },
    ),

  settings: (token: string) => api.get<Settings>(PATHS.settings.root, { token }),

  saveSetting: <K extends keyof Settings>(token: string, key: K, value: Settings[K]) =>
    api.put<Settings>(PATHS.settings.key(key), { value }, { token }),
};
