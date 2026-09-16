import { api, PATHS } from '../client';
import type { SystemRole } from './auth';

export interface Account {
  id: string;
  accountName: string;
  role: SystemRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminAction =
  | 'create'
  | 'reset_password'
  | 'change_role'
  | 'deactivate'
  | 'reactivate';

export interface AdminEvent {
  id: string;
  actorId: string;
  targetAccountId: string;
  action: AdminAction;
  details: Record<string, string> | null;
  createdAt: string;
}

/** El alta y el reinicio devuelven la contraseña en claro una sola vez. */
export interface WithHandover {
  account: Account;
  initialPassword: string;
}

export const accountsApi = {
  list: (token: string) => api.get<Account[]>(PATHS.accounts.root, { token }),

  auditLog: (token: string) => api.get<AdminEvent[]>(PATHS.accounts.auditLog, { token }),

  create: (token: string, accountName: string, role: SystemRole) =>
    api.post<WithHandover>(PATHS.accounts.root, { accountName, role }, { token }),

  resetPassword: (token: string, id: string) =>
    api.post<WithHandover>(PATHS.accounts.passwordReset(id), undefined, { token }),

  changeRole: (token: string, id: string, role: SystemRole) =>
    api.patch<Account>(PATHS.accounts.role(id), { role }, { token }),

  setActive: (token: string, id: string, active: boolean) =>
    api.post<Account>(
      active ? PATHS.accounts.reactivate(id) : PATHS.accounts.deactivate(id),
      undefined,
      { token },
    ),
};
