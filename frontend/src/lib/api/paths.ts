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
    worker: (id: string) => `/accounts/${id}/worker`,
  },
  resetRequests: {
    root: '/password-reset-requests',
    dismiss: (id: string) => `/password-reset-requests/${id}/dismiss`,
  },
  stopCauses: {
    root: '/stop-causes',
    deactivate: (id: string) => `/stop-causes/${id}/deactivate`,
    reactivate: (id: string) => `/stop-causes/${id}/reactivate`,
  },
  catalogs: {
    root: (kind: string) => `/catalogs/${kind}`,
    deactivate: (kind: string, id: string) => `/catalogs/${kind}/${id}/deactivate`,
    reactivate: (kind: string, id: string) => `/catalogs/${kind}/${id}/reactivate`,
  },
  settings: {
    root: '/settings',
    key: (key: string) => `/settings/${key}`,
  },
  orders: {
    root: '/orders',
    one: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    release: (id: string) => `/orders/${id}/release`,
    cancelLine: (lineId: string) => `/orders/lines/${lineId}/cancel`,
  },
  metrics: {
    root: '/metrics',
  },
  pickLists: {
    root: '/pick-lists',
    one: (id: string) => `/pick-lists/${id}`,
    pickers: '/pick-lists/pickers',
    mine: '/pick-lists/mine',
    validationQueue: '/pick-lists/validation-queue',
    reassign: (id: string) => `/pick-lists/${id}/reassign`,
    start: (id: string) => `/pick-lists/${id}/start`,
    line: (id: string, lineId: string) => `/pick-lists/${id}/lines/${lineId}`,
    stops: (id: string) => `/pick-lists/${id}/stops`,
    endStop: (id: string) => `/pick-lists/${id}/stops/end`,
    deliver: (id: string) => `/pick-lists/${id}/deliver`,
    validate: (id: string) => `/pick-lists/${id}/validate`,
  },
} as const;
