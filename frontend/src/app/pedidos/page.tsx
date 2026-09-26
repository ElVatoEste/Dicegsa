'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
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
import { Shell } from '@/components/Shell';
import { AssignBar } from '@/components/orders/AssignBar';
import { NewOrderDrawer } from '@/components/orders/NewOrderDrawer';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { urgencyOf } from '@/components/orders/urgency';
import { Button, Checkbox, Combobox } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/time';
import { useAction, useLive } from '@/lib/useLive';
import { useToast } from '@/components/Toasts';

type Column = Exclude<OrderStatus, 'cancelled'>;

/** `dot` es el color del estado: identifica la columna sin depender del título. */
const COLUMNS: { status: Column; title: string; empty: string; dot: string }[] = [
  { status: 'unassigned', title: 'Sin asignar', empty: 'No hay pedidos esperando.', dot: 'border-2 border-muted/60' },
  { status: 'in_progress', title: 'En preparación', empty: 'Nadie está alistando.', dot: 'bg-brand-500' },
  { status: 'validating', title: 'En validación', empty: 'Nada espera al validador.', dot: 'bg-warning' },
  { status: 'done', title: 'Finalizados', empty: 'Todavía no hay pedidos validados.', dot: 'bg-success' },
];

/** Los finalizados se acumulan todo el día; la columna muestra los últimos. */
const DONE_LIMIT = 30;

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
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const now = useNow();
  const toast = useToast();
  const { run } = useAction();
  const [drag, setDrag] = useState<{ ids: string[]; from: Column } | null>(null);
  const [over, setOver] = useState<Column | null>(null);
  const [assignSignal, setAssignSignal] = useState(0);

  const threshold = data?.settings.urgentThresholdMinutes ?? 120;
  const zoneName = useMemo(() => {
    const all = [...(data?.dispatchZones ?? []), ...(data?.inventoryZones ?? [])];
    return new Map(all.map((z) => [z.id, z.name]));
  }, [data]);

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = (data?.orders ?? []).filter(
      (o) =>
        o.status !== 'cancelled' &&
        (!zone || o.inventoryZoneId === zone) &&
        (!q || o.externalId.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q)),
    );
    const by = (status: Column) => visible.filter((o) => o.status === status);
    return {
      unassigned: by('unassigned'),
      in_progress: by('in_progress'),
      validating: by('validating'),
      // Lo último validado arriba.
      done: by('done').reverse(),
    };
  }, [data, zone, query]);

  const selectedRows = columns.unassigned.filter((o) => selected.has(o.id));
  const openOrder = data?.orders.find((o) => o.id === openId) ?? null;

  /** Qué columnas aceptan lo que se está arrastrando. Solo se mueve lo que mesa de control decide. */
  function accepts(target: Column): boolean {
    if (!drag || drag.from === target) return false;
    return (
      (drag.from === 'unassigned' && target === 'in_progress') ||
      (drag.from === 'in_progress' && target === 'unassigned')
    );
  }

  async function drop(target: Column) {
    const moving = drag;
    setDrag(null);
    setOver(null);
    if (!moving || moving.from === target) return;

    if (moving.from === 'unassigned' && target === 'in_progress') {
      // Se asigna con la barra de abajo: soltar selecciona y abre el selector de alistador.
      setSelected(new Set(moving.ids));
      // Se abre cuando la barra terminó de entrar; antes quedaría posicionado a mitad de camino.
      setTimeout(() => setAssignSignal((n) => n + 1), 320);
      return;
    }
    if (moving.from === 'in_progress' && target === 'unassigned') {
      const ok = await run(
        () => Promise.all(moving.ids.map((id) => ordersApi.release(token!, id))),
        moving.ids.length === 1 ? 'Pedido devuelto a sin asignar' : `${moving.ids.length} pedidos devueltos a sin asignar`,
      );
      if (ok) void reload();
      return;
    }
  }

  /** El navegador no dispara el soltado sobre una columna que rechaza: el aviso sale al terminar el arrastre. */
  function refuse(target: Column) {
    toast.warning(
      target === 'validating'
        ? 'Pasa a validación cuando el alistador entrega el PKL.'
        : target === 'done'
          ? 'Se finaliza cuando el validador aprueba el PKL.'
          : 'Ese pedido ya salió de preparación.',
    );
  }

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
      wide
      role={session.role}
      accountName={session.accountName}
      connection={connection}
      actions={
        canEdit && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden />
            Nuevo pedido
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pedido o cliente"
            aria-label="Buscar pedido o cliente"
            className="h-10 w-60 rounded-lg border border-line bg-surface pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
          />
        </label>
        <div className="w-64">
          <Combobox
            size="sm"
            value={zone}
            onChange={setZone}
            aria-label="Filtrar por zona de inventario"
            placeholder="Todas las zonas de inventario"
            searchPlaceholder="Buscar zona…"
            className="h-10"
            options={[
              { value: '', label: 'Todas las zonas de inventario' },
              ...(data?.inventoryZones.filter((z) => z.active).map((z) => ({ value: z.id, label: z.name })) ?? []),
            ]}
          />
        </div>
      </div>

      <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-4 md:-mx-10 md:px-10">
        <div className="grid min-w-[64rem] grid-cols-4 items-start gap-4">
          {COLUMNS.map(({ status, title, empty, dot }) => {
            const all = columns[status];
            const cards = status === 'done' ? all.slice(0, DONE_LIMIT) : all;
            const urgent = status === 'done' ? 0 : all.filter((o) => urgencyOf(o.dueAt, now, threshold) !== 'normal').length;
            const selectable = canEdit && status === 'unassigned';
            return (
              <section
                key={status}
                aria-label={title}
                onDragOver={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = accepts(status) ? 'move' : 'none';
                  if (over !== status) setOver(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void drop(status);
                }}
                className={cn(
                  'flex max-h-[calc(100vh-13rem)] flex-col rounded-xl border border-transparent bg-brand-900/[0.03] transition-[background-color,border-color,opacity] duration-150',
                  drag && drag.from !== status && !accepts(status) && 'opacity-45',
                  drag && accepts(status) && 'border-dashed border-brand-300',
                  over === status && accepts(status) && 'border-solid border-brand-400 bg-brand-100/60',
                )}
              >
                <header className="flex h-11 items-center gap-2 px-3">
                  {selectable && all.length > 0 && (
                    <Checkbox
                      label="Seleccionar todos los pedidos sin asignar"
                      checked={selectedRows.length === all.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < all.length}
                      onChange={(on) => setSelected(on ? new Set(all.map((o) => o.id)) : new Set())}
                    />
                  )}
                  {!(selectable && all.length > 0) && <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', dot)} />}
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <span className="cifras text-xs text-muted">{all.length}</span>
                  {urgent > 0 && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-danger" title="De pronta entrega">
                      <span aria-hidden className="size-1.5 rounded-full bg-danger" />
                      <span className="cifras">{urgent}</span> {urgent === 1 ? 'urgente' : 'urgentes'}
                    </span>
                  )}
                </header>
                <div className="min-h-24 flex-1 overflow-y-auto px-2 pb-2">
                  {!data ? (
                    <div className="space-y-2">
                      {[0, 1].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-lg bg-surface/70" />
                      ))}
                    </div>
                  ) : cards.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs text-muted">
                      {empty}
                    </p>
                  ) : (
                    <ul className="escalona space-y-2">
                      {cards.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          urgency={urgencyOf(order.dueAt, now, threshold)}
                          now={now}
                          zoneName={zoneName}
                          selectable={selectable}
                          selected={selected.has(order.id)}
                          onSelect={(on) => toggle(order.id, on)}
                          onOpen={() => setOpenId(order.id)}
                          draggable={canEdit && (status === 'unassigned' || status === 'in_progress')}
                          dragging={drag?.ids.includes(order.id) ?? false}
                          onDragStart={(e) => {
                            // Si la tarjeta estaba seleccionada, se mueve toda la selección.
                            const ids = selected.has(order.id) && status === 'unassigned' ? [...selected] : [order.id];
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', ids.join(','));
                            setDrag({ ids, from: status });
                          }}
                          onDragEnd={() => {
                            if (over && over !== status && !accepts(over)) refuse(over);
                            setDrag(null);
                            setOver(null);
                          }}
                        />
                      ))}
                    </ul>
                  )}
                  {all.length > cards.length && (
                    <p className="mt-2 text-center text-xs text-muted">
                      y {all.length - cards.length} más anteriores
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <AssignBar
        openSignal={assignSignal}
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
