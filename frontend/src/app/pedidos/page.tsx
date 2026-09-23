'use client';

import { useMemo, useState } from 'react';
import { PackageOpen, Plus, Search, UserRoundCheck, X } from 'lucide-react';
import {
  catalogsApi,
  ordersApi,
  pickListsApi,
  type CatalogEntry,
  type OrderRow,
  type OrderStatus,
  type Picker,
  type Settings,
} from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Shell } from '@/components/Shell';
import { NewOrderDrawer } from '@/components/orders/NewOrderDrawer';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { urgencyOf, type Urgency } from '@/components/orders/urgency';
import { Badge, Button, Checkbox, EmptyState, Select, Tabs } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import { formatDateTime, formatRemaining, useNow } from '@/lib/time';
import { useAction, useLive } from '@/lib/useLive';

type View = Exclude<OrderStatus, 'cancelled'> | 'all';

interface Board {
  orders: OrderRow[];
  dispatchZones: CatalogEntry[];
  inventoryZones: CatalogEntry[];
  pickers: Picker[];
  settings: Settings;
}

async function loadBoard(token: string): Promise<Board> {
  const [orders, dispatchZones, inventoryZones, pickers, settings] = await Promise.all([
    ordersApi.list(token),
    catalogsApi.list(token, 'dispatch_zone'),
    catalogsApi.list(token, 'inventory_zone'),
    pickListsApi.pickers(token),
    catalogsApi.settings(token),
  ]);
  return { orders, dispatchZones, inventoryZones, pickers, settings };
}

export default function OrdersPage() {
  const session = useAuthGuard(['control_desk', 'supervisor', 'management', 'admin']);
  const token = session?.token;
  const canEdit = session?.role === 'control_desk' || session?.role === 'admin';

  const { data, reload, connection } = useLive(token, loadBoard, (e) => e.room === 'board');
  const [view, setView] = useState<View>('unassigned');
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const now = useNow();

  const threshold = data?.settings.urgentThresholdMinutes ?? 120;
  const zoneName = useMemo(() => {
    const all = [...(data?.dispatchZones ?? []), ...(data?.inventoryZones ?? [])];
    return new Map(all.map((z) => [z.id, z.name]));
  }, [data]);

  const live = useMemo(() => (data?.orders ?? []).filter((o) => o.status !== 'cancelled'), [data]);

  const counts = useMemo(() => {
    const c = { unassigned: 0, in_progress: 0, validating: 0, done: 0, all: live.length, urgentUnassigned: 0 };
    for (const o of live) {
      c[o.status as Exclude<OrderStatus, 'cancelled'>]++;
      if (o.status === 'unassigned' && urgencyOf(o.dueAt, now, threshold) !== 'normal') c.urgentUnassigned++;
    }
    return c;
  }, [live, now, threshold]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return live.filter(
      (o) =>
        (view === 'all' || o.status === view) &&
        (!zone || o.inventoryZoneId === zone) &&
        (!q || o.externalId.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q)),
    );
  }, [live, view, zone, query]);

  const selectable = canEdit && view === 'unassigned';
  const selectedRows = rows.filter((o) => selected.has(o.id));
  const openOrder = data?.orders.find((o) => o.id === openId) ?? null;

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (!session || !token) return null;

  return (
    <Shell
      title="Pedidos"
      subtitle="Lo que llega de televentas, ordenado por fecha de entrega. Lo de pronta entrega se marca en rojo."
      role={session.role}
      accountName={session.accountName}
      status={<ConnectionStatus state={connection} />}
      actions={
        canEdit && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden />
            Nuevo pedido
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Tabs<View>
          value={view}
          onChange={(v) => {
            setView(v);
            setSelected(new Set());
          }}
          options={[
            { value: 'unassigned', label: 'Sin asignar', count: counts.unassigned, alert: counts.urgentUnassigned > 0 },
            { value: 'in_progress', label: 'En preparación', count: counts.in_progress },
            { value: 'validating', label: 'En validación', count: counts.validating },
            { value: 'done', label: 'Finalizados', count: counts.done },
            { value: 'all', label: 'Todos', count: counts.all },
          ]}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pedido o cliente"
              aria-label="Buscar pedido o cliente"
              className="h-10 w-52 rounded-lg border border-line bg-surface pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
            />
          </label>
          <Select size="sm" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Filtrar por zona de inventario" className="h-10 w-56">
            <option value="">Todas las zonas de inventario</option>
            {data?.inventoryZones.filter((z) => z.active).map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {!data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={view === 'unassigned' ? 'No hay pedidos esperando' : 'Nada por acá'}
            description={
              view === 'unassigned'
                ? 'Cuando televentas libere un pedido, cargalo con “Nuevo pedido” y aparece acá.'
                : 'Probá con otra pestaña o sacá los filtros.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="hidden grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_6rem_minmax(0,1.2fr)_minmax(0,1.3fr)] gap-4 border-b border-line px-4 py-2.5 text-xs font-semibold text-muted lg:grid">
              <span>
                {selectable && (
                  <Checkbox
                    label="Seleccionar todos"
                    checked={selectedRows.length === rows.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < rows.length}
                    onChange={(on) => setSelected(on ? new Set(rows.map((o) => o.id)) : new Set())}
                  />
                )}
              </span>
              <span>Pedido</span>
              <span>Destino</span>
              <span>Inventario</span>
              <span className="text-right">Unidades</span>
              <span>Entrega</span>
              <span>Estado</span>
            </div>
            <ul className="escalona divide-y divide-line">
              {rows.map((order) => (
                <OrderLine
                  key={order.id}
                  order={order}
                  urgency={urgencyOf(order.dueAt, now, threshold)}
                  now={now}
                  zoneName={zoneName}
                  selectable={selectable}
                  selected={selected.has(order.id)}
                  onSelect={(on) => toggle(order.id, on)}
                  onOpen={() => setOpenId(order.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <AssignBar
        orders={selectedRows}
        pickers={data?.pickers ?? []}
        token={token}
        onClear={() => setSelected(new Set())}
        onDone={() => {
          setSelected(new Set());
          void reload();
        }}
      />

      {data && (
        <>
          <NewOrderDrawer
            open={creating}
            onClose={() => setCreating(false)}
            token={token}
            dispatchZones={data.dispatchZones}
            inventoryZones={data.inventoryZones}
            onCreated={reload}
          />
          <OrderDrawer
            order={openOrder}
            onClose={() => setOpenId(null)}
            token={token}
            canEdit={canEdit}
            dispatchZones={data.dispatchZones}
            inventoryZones={data.inventoryZones}
            pickers={data.pickers}
            thresholdMinutes={threshold}
            onChanged={reload}
          />
        </>
      )}
    </Shell>
  );
}

const STATUS_TONE = {
  unassigned: 'neutral',
  in_progress: 'brand',
  validating: 'warning',
  done: 'success',
  cancelled: 'neutral',
} as const;

function OrderLine({
  order,
  urgency,
  now,
  zoneName,
  selectable,
  selected,
  onSelect,
  onOpen,
}: {
  order: OrderRow;
  urgency: Urgency;
  now: number;
  zoneName: Map<string, string>;
  selectable: boolean;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onOpen: () => void;
}) {
  const hot = urgency !== 'normal' && order.status !== 'done';
  return (
    <li
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`Abrir pedido ${order.externalId}`}
      className={cn(
        'relative grid cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 px-4 py-3.5 text-sm outline-none transition-colors duration-150',
        'lg:grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_6rem_minmax(0,1.2fr)_minmax(0,1.3fr)] lg:items-center',
        selected ? 'bg-brand-50' : hot ? 'bg-danger-soft/40 hover:bg-danger-soft/70' : 'hover:bg-brand-50/60',
        'focus-visible:bg-brand-50',
      )}
    >
      {/* Franja de urgencia: se ve sin leer la fila. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-1 transition-colors',
          hot ? 'bg-danger' : order.status === 'done' ? 'bg-success/60' : 'bg-transparent',
        )}
      />
      <span className="row-span-3 pt-0.5 lg:row-span-1 lg:pt-0">
        {selectable && (
          <Checkbox label={`Seleccionar pedido ${order.externalId}`} checked={selected} onChange={onSelect} />
        )}
      </span>

      <span className="min-w-0">
        <span className="cifras block text-xs text-muted">{order.externalId}</span>
        <span className="block truncate font-medium">{order.clientName}</span>
      </span>

      <span className="min-w-0 text-muted">
        <span className="block truncate text-ink">{order.municipality}, {order.department}</span>
        <span className="block truncate text-xs">
          {order.dispatchZoneId ? zoneName.get(order.dispatchZoneId) : 'Sin zona de despacho'}
        </span>
      </span>

      <span className="min-w-0">
        {order.inventoryZoneId ? (
          <Badge tone="brand" className="max-w-full truncate">{zoneName.get(order.inventoryZoneId)}</Badge>
        ) : (
          <span className="text-xs text-muted">Sin zona</span>
        )}
      </span>

      <span className="cifras text-muted lg:text-right">
        <span className="font-semibold text-ink">{order.units}</span>
        <span className="text-xs"> u · {order.lineCount} l</span>
      </span>

      <span className="min-w-0">
        <span className={cn('flex items-center gap-1.5 font-medium', hot && 'text-danger')}>
          {hot && <span aria-hidden className="pulsa size-1.5 rounded-full bg-danger" />}
          {order.status === 'done' ? 'Entregado a despacho' : formatRemaining(new Date(order.dueAt).getTime() - now)}
        </span>
        <span className="block text-xs text-muted">{formatDateTime(order.dueAt)}</span>
      </span>

      <span className="min-w-0">
        <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
        {order.assignee && (
          <span className="mt-1 block truncate text-xs text-muted">
            <span className="cifras">PKL {order.pickListNumber}</span> · {order.assignee.name}
          </span>
        )}
      </span>
    </li>
  );
}

/** Aparece al seleccionar pedidos: los junta en un PKL y lo asigna de una vez. */
function AssignBar({
  orders,
  pickers,
  token,
  onClear,
  onDone,
}: {
  orders: OrderRow[];
  pickers: Picker[];
  token: string;
  onClear: () => void;
  onDone: () => void;
}) {
  const [pickerId, setPickerId] = useState('');
  const { busy, run } = useAction();
  const open = orders.length > 0;
  const units = orders.reduce((s, o) => s + o.units, 0);
  const picker = pickers.find((p) => p.id === pickerId);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 transition-[transform,opacity] duration-300 ease-[var(--ease-out)] md:pl-60',
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
      aria-hidden={!open}
    >
      <div className="flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-2xl bg-brand-950 p-3 pl-5 text-white shadow-2xl shadow-brand-950/30">
        <div className="mr-auto">
          <p className="text-sm font-medium">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <p className="cifras text-xs text-white/60">{units} unidades</p>
        </div>
        <select
          value={pickerId}
          onChange={(e) => setPickerId(e.target.value)}
          aria-label="Alistador"
          className="h-10 w-56 rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus:border-brand-300 [&>option]:text-ink"
        >
          <option value="">Elegí un alistador</option>
          {pickers.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <button
          disabled={!picker || busy}
          onClick={async () => {
            if (!picker) return;
            const ok = await run(
              () => pickListsApi.create(token, orders.map((o) => o.id), picker.id),
              `PKL asignado a ${picker.fullName}`,
            );
            if (ok) {
              setPickerId('');
              onDone();
            }
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-brand-300 px-4 text-sm font-semibold text-brand-950 transition-[background-color,transform,opacity] duration-150 hover:bg-brand-200 active:scale-[0.97] disabled:opacity-40"
        >
          <UserRoundCheck size={16} aria-hidden />
          Armar PKL y asignar
        </button>
        <button
          onClick={onClear}
          aria-label="Quitar selección"
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
