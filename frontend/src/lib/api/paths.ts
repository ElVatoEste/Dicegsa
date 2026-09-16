/**
 * Rutas del API en un solo lugar. Ningún recurso arma la URL a mano: si el backend
 * mueve un endpoint, se corrige acá y no repartido por las llamadas.
 */
export const PATHS = {
  auth: {
    login: '/auth/login',
    password: '/auth/password',
    me: '/auth/me',
  },
  accounts: {
    root: '/accounts',
    auditLog: '/accounts/audit-log',
    passwordReset: (id: string) => `/accounts/${id}/password-reset`,
    role: (id: string) => `/accounts/${id}/role`,
    deactivate: (id: string) => `/accounts/${id}/deactivate`,
    reactivate: (id: string) => `/accounts/${id}/reactivate`,
  },
} as const;
