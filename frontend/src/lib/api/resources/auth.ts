import { api, PATHS } from '../client';

export type SystemRole =
  | 'operator'
  | 'validator'
  | 'control_desk'
  | 'supervisor'
  | 'management'
  | 'admin';

export interface Session {
  token: string;
  accountName: string;
  role: SystemRole;
  mustChangePassword: boolean;
}

export const authApi = {
  login: (accountName: string, password: string) =>
    api.post<Session>(PATHS.auth.login, { accountName, password }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    api.post<{ token: string }>(PATHS.auth.password, { currentPassword, newPassword }, { token }),

  me: (token: string) => api.get<Omit<Session, 'token'>>(PATHS.auth.me, { token }),
};
