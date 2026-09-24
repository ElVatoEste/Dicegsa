import { api, PATHS } from '../client';

export interface StopCause {
  id: string;
  name: string;
  /** Imputable al colaborador: no descuenta de la Disponibilidad. */
  attributable: boolean;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export const stopCausesApi = {
  list: (token: string) => api.get<StopCause[]>(PATHS.stopCauses.root, { token }),

  create: (token: string, name: string, attributable: boolean) =>
    api.post<StopCause>(PATHS.stopCauses.root, { name, attributable }, { token }),

  setActive: (token: string, id: string, active: boolean) =>
    api.post<StopCause>(
      active ? PATHS.stopCauses.reactivate(id) : PATHS.stopCauses.deactivate(id),
      undefined,
      { token },
    ),
};
