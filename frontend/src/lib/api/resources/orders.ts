import { api, PATHS } from '../client';

export type OrderStatus = 'unassigned' | 'in_progress' | 'validating' | 'done' | 'cancelled';
export type PickListStatus = 'assigned' | 'picking' | 'validating' | 'returned' | 'done';
export type LineStatus = 'pending' | 'picked' | 'not_found' | 'cancelled';
export type LineMark = 'picked' | 'not_found' | 'pending';

export interface OrderLine {
  id: string;
  orderId: string;
  productCode: string;
  productName: string;
  quantity: number;
  lot: string;
  expiresOn: string | null;
  status: LineStatus;
}

interface OrderBase {
  id: string;
  externalId: string;
  receivedAt: string;
  clientCode: string;
  clientName: string;
  department: string;
  municipality: string;
  notes: string | null;
  dueAt: string;
  dispatchZoneId: string | null;
  inventoryZoneId: string | null;
  pickListId: string | null;
  cancelledAt: string | null;
}

/** Fila de la tabla de mesa de control. */
export interface OrderRow extends OrderBase {
  status: OrderStatus;
  pickListNumber: number | null;
  assignee: { id: string; name: string } | null;
  lineCount: number;
  units: number;
}

export interface OrderDetail extends OrderBase {
  lines: OrderLine[];
}

export interface NewOrder {
  externalId: string;
  receivedAt: string;
  clientCode: string;
  clientName: string;
  department: string;
  municipality: string;
  notes?: string;
  dueAt: string;
  dispatchZoneId?: string;
  inventoryZoneId?: string;
  lines: Omit<OrderLine, 'id' | 'orderId' | 'status'>[];
}

export interface OrderPatch {
  dispatchZoneId?: string | null;
  inventoryZoneId?: string | null;
  dueAt?: string;
  notes?: string | null;
}

export interface Picker {
  id: string;
  accountName: string;
  fullName: string;
}

export interface PickList {
  id: string;
  number: number;
  status: PickListStatus;
  createdAt: string;
  assignee: { id: string; name: string; assignedAt: string } | null;
  dueAt: string | null;
  orders: (OrderBase & { lines: OrderLine[] })[];
  openStop: { id: string; causeId: string; causeName: string; startedAt: string } | null;
  errors: {
    id: string;
    lineId: string;
    units: number;
    note: string | null;
    errorType: string;
    createdAt: string;
  }[];
}

export interface ValidationErrorInput {
  lineId: string;
  errorTypeId: string;
  units: number;
  note?: string;
}

export const ordersApi = {
  list: (token: string) => api.get<OrderRow[]>(PATHS.orders.root, { token }),
  detail: (token: string, id: string) => api.get<OrderDetail>(PATHS.orders.one(id), { token }),
  create: (token: string, order: NewOrder) => api.post<OrderBase>(PATHS.orders.root, order, { token }),
  update: (token: string, id: string, patch: OrderPatch) =>
    api.patch<OrderBase>(PATHS.orders.one(id), patch, { token }),
  cancel: (token: string, id: string) => api.post<void>(PATHS.orders.cancel(id), undefined, { token }),
  release: (token: string, id: string) => api.post<void>(PATHS.orders.release(id), undefined, { token }),
  cancelLine: (token: string, lineId: string) =>
    api.post<OrderLine>(PATHS.orders.cancelLine(lineId), undefined, { token }),
};

export const pickListsApi = {
  pickers: (token: string) => api.get<Picker[]>(PATHS.pickLists.pickers, { token }),
  mine: (token: string) => api.get<PickList[]>(PATHS.pickLists.mine, { token }),
  validationQueue: (token: string) => api.get<PickList[]>(PATHS.pickLists.validationQueue, { token }),
  detail: (token: string, id: string) => api.get<PickList>(PATHS.pickLists.one(id), { token }),
  create: (token: string, orderIds: string[], assigneeId: string) =>
    api.post<{ id: string; number: number }>(PATHS.pickLists.root, { orderIds, assigneeId }, { token }),
  reassign: (token: string, id: string, assigneeId: string) =>
    api.post<void>(PATHS.pickLists.reassign(id), { assigneeId }, { token }),
  start: (token: string, id: string) => api.post<PickList>(PATHS.pickLists.start(id), undefined, { token }),
  markLine: (token: string, id: string, lineId: string, status: LineMark) =>
    api.post<PickList>(PATHS.pickLists.line(id, lineId), { status }, { token }),
  startStop: (token: string, id: string, causeId: string, note?: string) =>
    api.post<PickList>(PATHS.pickLists.stops(id), { causeId, note }, { token }),
  endStop: (token: string, id: string) =>
    api.post<PickList>(PATHS.pickLists.endStop(id), undefined, { token }),
  deliver: (token: string, id: string) => api.post<void>(PATHS.pickLists.deliver(id), undefined, { token }),
  validate: (token: string, id: string, errors: ValidationErrorInput[]) =>
    api.post<void>(PATHS.pickLists.validate(id), { errors }, { token }),
};
