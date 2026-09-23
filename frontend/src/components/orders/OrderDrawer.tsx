'use client';

import { useEffect, useState } from 'react';
import { Ban, CalendarClock, RefreshCw, UserRound } from 'lucide-react';
import {
  ordersApi,
  pickListsApi,
  type CatalogEntry,
  type OrderDetail,
  type OrderRow,
  type Picker,
} from '@/lib/api';
import { Badge, Button, Drawer, Field, Input, Select } from '@/components/ui';
import { LINE_STATUS_LABEL, ORDER_STATUS_LABEL } from '@/lib/labels';
import { formatDateTime, formatDay, formatRemaining, fromLocalInput, toLocalInput, useNow } from '@/lib/time';
import { useAction } from '@/lib/useLive';
import { cn } from '@/lib/cn';
import { urgencyOf } from './urgency';

const STATUS_TONE = {
  unassigned: 'neutral',
  in_progress: 'brand',
  validating: 'warning',
  done: 'success',
  cancelled: 'neutral',
} as const;

export function OrderDrawer({
  order,
  onClose,
  token,
  canEdit,
  dispatchZones,
  inventoryZones,
  pickers,
  thresholdMinutes,
  onChanged,
}: {
  order: OrderRow | null;
  onClose: () => void;
  token: string;
  canEdit: boolean;
  dispatchZones: CatalogEntry[];
  inventoryZones: CatalogEntry[];
  pickers: Picker[];
  thresholdMinutes: number;
  onChanged: () => void;
}) {
  // El panel conserva el último pedido mientras anima la salida.
  const [shown, setShown] = useState<OrderRow | null>(order);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [dueAt, setDueAt] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { busy, run } = useAction();
  const now = useNow();

  useEffect(() => {
    if (order) setShown(order);
    setConfirmCancel(false);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    setDueAt(toLocalInput(order.dueAt));
    setDetail(null);
    ordersApi.detail(token, order.id).then(setDetail, () => setDetail(null));
  }, [order, token]);

  if (!shown) return null;

  const editable = canEdit && shown.status !== 'cancelled' && shown.status !== 'done';
  const urgency = urgencyOf(shown.dueAt, now, thresholdMinutes);
  const dueChanged = dueAt && fromLocalInput(dueAt) !== new Date(shown.dueAt).toISOString();

  async function act(action: () => Promise<unknown>, success: string) {
    if (await run(action, success)) {
      onChanged();
      if (order) ordersApi.detail(token, order.id).then(setDetail, () => undefined);
    }
  }

  return (
    <Drawer
      open={order !== null}
      onClose={onClose}
      wide
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="cifras">{shown.externalId}</span>
          <Badge tone={STATUS_TONE[shown.status]}>{ORDER_STATUS_LABEL[shown.status]}</Badge>
        </span>
      }
      subtitle={shown.clientName}
      footer={
        editable ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {confirmCancel ? 'Se da de baja con todas sus líneas.' : 'Solo si televentas lo anuló.'}
            </p>
            <Button
              variant="danger"
              size="sm"
              loading={busy && confirmCancel}
              onClick={() => {
                if (!confirmCancel) return setConfirmCancel(true);
                void act(() => ordersApi.cancel(token, shown.id), `Pedido ${shown.externalId} dado de baja`);
              }}
            >
              <Ban size={14} aria-hidden />
              {confirmCancel ? 'Confirmar baja' : 'Dar de baja el pedido'}
            </Button>
          </div>
        ) : undefined
      }
    >
      <section
        className={cn(
          'rounded-xl border p-4',
          urgency === 'normal' ? 'border-line bg-canvas/50' : 'border-danger/30 bg-danger-soft',
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-medium text-muted">
              <CalendarClock size={14} aria-hidden />
              Entrega
            </p>
            <p className={cn('mt-1 text-lg font-semibold', urgency !== 'normal' && 'text-danger')}>
              {formatRemaining(new Date(shown.dueAt).getTime() - now)}
            </p>
            <p className="text-xs text-muted">{formatDateTime(shown.dueAt)}</p>
          </div>
          {editable && (
            <div className="flex items-end gap-2">
              <Input
                type="datetime-local"
                size="sm"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                aria-label="Nueva fecha de entrega"
                className="w-52"
              />
              <Button
                size="sm"
                disabled={!dueChanged}
                loading={busy && !!dueChanged}
                onClick={() =>
                  act(
                    () => ordersApi.update(token, shown.id, { dueAt: fromLocalInput(dueAt) }),
                    'Fecha de entrega cambiada',
                  )
                }
              >
                Cambiar
              </Button>
            </div>
          )}
        </div>
      </section>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Info label="Id de cliente" value={<span className="cifras">{shown.clientCode}</span>} />
        <Info label="Llegó" value={formatDateTime(shown.receivedAt)} />
        <Info label="Departamento" value={shown.department} />
        <Info label="Municipio" value={shown.municipality} />
        {shown.notes && <Info label="Notas de televentas" value={shown.notes} wide />}
      </dl>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ZoneSelect
          label="Zona de despacho"
          value={shown.dispatchZoneId}
          zones={dispatchZones}
          disabled={!editable || busy}
          onChange={(id) => act(() => ordersApi.update(token, shown.id, { dispatchZoneId: id }), 'Zona de despacho asignada')}
        />
        <ZoneSelect
          label="Zona de inventario"
          value={shown.inventoryZoneId}
          zones={inventoryZones}
          disabled={!editable || busy}
          onChange={(id) => act(() => ordersApi.update(token, shown.id, { inventoryZoneId: id }), 'Zona de inventario asignada')}
        />
      </div>

      {shown.pickListNumber !== null && (
        <section className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line p-4">
          <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700">
            <UserRound size={17} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{shown.assignee?.name ?? 'Sin alistador'}</p>
            <p className="cifras text-xs text-muted">PKL {shown.pickListNumber}</p>
          </div>
          {canEdit && shown.status === 'in_progress' && shown.pickListId && (
            <label className="flex items-center gap-2 text-xs text-muted">
              <RefreshCw size={13} aria-hidden />
              <Select
                size="sm"
                value=""
                disabled={busy}
                aria-label="Reasignar el PKL"
                className="w-48"
                onChange={(e) => {
                  const picker = pickers.find((p) => p.id === e.target.value);
                  if (picker)
                    void act(
                      () => pickListsApi.reassign(token, shown.pickListId!, picker.id),
                      `PKL ${shown.pickListNumber} reasignado a ${picker.fullName}`,
                    );
                }}
              >
                <option value="">Reasignar a…</option>
                {pickers.filter((p) => p.id !== shown.assignee?.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </Select>
            </label>
          )}
        </section>
      )}

      <h3 className="mt-6 flex items-baseline justify-between text-sm font-semibold">
        Contenido
        <span className="cifras text-xs font-normal text-muted">
          {shown.lineCount} líneas · {shown.units} unidades
        </span>
      </h3>
      {!detail ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-canvas" />
          ))}
        </div>
      ) : (
        <ul className="escalona mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
          {detail.lines.map((line) => (
            <li
              key={line.id}
              className={cn('flex items-center gap-4 px-4 py-3 text-sm', line.status === 'cancelled' && 'opacity-50')}
            >
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-medium', line.status === 'cancelled' && 'line-through')}>
                  {line.productName}
                </p>
                <p className="cifras mt-0.5 text-xs text-muted">
                  {line.productCode} · lote {line.lot}
                  {line.expiresOn && ` · vence ${formatDay(line.expiresOn)}`}
                </p>
              </div>
              <LineBadge status={line.status} />
              <span className="cifras w-10 text-right font-semibold">{line.quantity}</span>
              {editable && line.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  aria-label={`Dar de baja ${line.productName}`}
                  title="Dar de baja la línea"
                  onClick={() => act(() => ordersApi.cancelLine(token, line.id), `${line.productName} dada de baja`)}
                >
                  <Ban size={14} aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function Info({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function ZoneSelect({
  label,
  value,
  zones,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  zones: CatalogEntry[];
  disabled: boolean;
  onChange: (id: string | null) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Sin asignar</option>
        {zones.filter((z) => z.active || z.id === value).map((z) => (
          <option key={z.id} value={z.id}>{z.name}</option>
        ))}
      </Select>
    </Field>
  );
}

function LineBadge({ status }: { status: OrderDetail['lines'][number]['status'] }) {
  const tone = { pending: 'neutral', picked: 'success', not_found: 'danger', cancelled: 'neutral' } as const;
  return <Badge tone={tone[status]}>{LINE_STATUS_LABEL[status]}</Badge>;
}
