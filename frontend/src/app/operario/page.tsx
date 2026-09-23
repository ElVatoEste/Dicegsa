'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  ClipboardList,
  LogOut,
  PackageCheck,
  PauseCircle,
  PlayCircle,
  SearchX,
  Undo2,
} from 'lucide-react';
import {
  catalogsApi,
  pickListsApi,
  stopCausesApi,
  type LineMark,
  type OrderLine,
  type PickList,
  type Settings,
  type StopCause,
} from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Logo } from '@/components/Logo';
import { urgencyOf } from '@/components/orders/urgency';
import { Badge, Button, Drawer, EmptyState, Input, Progress } from '@/components/ui';
import { cn } from '@/lib/cn';
import { clearSession } from '@/lib/session';
import { formatDay, formatElapsed, formatRemaining, useNow } from '@/lib/time';
import { useAction, useLive } from '@/lib/useLive';

interface Work {
  pickLists: PickList[];
  causes: StopCause[];
  settings: Settings;
}

async function loadWork(token: string): Promise<Work> {
  const [pickLists, causes, settings] = await Promise.all([
    pickListsApi.mine(token),
    stopCausesApi.list(token),
    catalogsApi.settings(token),
  ]);
  return { pickLists, causes: causes.filter((c) => c.active), settings };
}

function linesOf(pickList: PickList): OrderLine[] {
  return pickList.orders.flatMap((o) => o.lines);
}

/** Vista del alistador. Corre en las computadoras compartidas del almacén. */
export default function OperatorPage() {
  const session = useAuthGuard(['operator']);
  const router = useRouter();
  const token = session?.token;
  const { data, setData, connection } = useLive(token, loadWork);
  const [activeId, setActiveId] = useState<string | null>(null);
  const now = useNow(1000);

  const pickLists = data?.pickLists ?? [];
  const active = pickLists.find((p) => p.id === activeId) ?? pickLists[0] ?? null;
  const threshold = data?.settings.urgentThresholdMinutes ?? 120;

  function replace(updated: PickList) {
    setData((d) => d && { ...d, pickLists: d.pickLists.map((p) => (p.id === updated.id ? updated : p)) });
  }

  if (!session || !token) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 bg-brand-950 px-5 py-3 text-white md:px-8">
        <Logo tone="dark" />
        <span className="ml-auto hidden sm:block">
          <ConnectionStatus state={connection} />
        </span>
        {/* Computadora compartida: quién está marcando tiene que verse siempre. */}
        <div className="flex items-center gap-3 rounded-xl bg-white/8 py-1.5 pl-3 pr-1.5">
          <span className="grid size-8 place-items-center rounded-full bg-brand-300 text-xs font-semibold text-brand-950">
            {session.accountName.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{session.accountName}</span>
          <button
            onClick={() => {
              clearSession();
              router.replace('/');
            }}
            className="flex h-10 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-[0.97]"
          >
            <LogOut size={16} aria-hidden />
            Cambiar de usuario
          </button>
        </div>
      </header>

      <main className="entra mx-auto w-full max-w-7xl flex-1 px-5 py-6 md:px-8">
        {!data ? (
          <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
            <div className="h-40 animate-pulse rounded-2xl bg-surface" />
            <div className="h-96 animate-pulse rounded-2xl bg-surface" />
          </div>
        ) : pickLists.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tenés PKL asignados"
            description="Cuando mesa de control te asigne uno, aparece acá."
            className="mt-10"
          />
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[20rem_1fr]">
            <nav aria-label="Tus PKL" className="escalona space-y-2 lg:sticky lg:top-6">
              <p className="px-1 text-xs font-semibold text-muted">Tus PKL · {pickLists.length}</p>
              {pickLists.map((p) => (
                <PickListCard
                  key={p.id}
                  pickList={p}
                  active={p.id === active?.id}
                  hot={p.dueAt ? urgencyOf(p.dueAt, now, threshold) !== 'normal' : false}
                  now={now}
                  onClick={() => setActiveId(p.id)}
                />
              ))}
            </nav>
            {active && (
              <PickListWork
                key={active.id}
                pickList={active}
                causes={data.causes}
                token={token}
                now={now}
                onChange={replace}
                onDelivered={() =>
                  setData((d) => d && { ...d, pickLists: d.pickLists.map((p) => (p.id === active.id ? { ...p, status: 'validating' } : p)) })
                }
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PickListCard({
  pickList,
  active,
  hot,
  now,
  onClick,
}: {
  pickList: PickList;
  active: boolean;
  hot: boolean;
  now: number;
  onClick: () => void;
}) {
  const lines = linesOf(pickList).filter((l) => l.status !== 'cancelled');
  const done = lines.filter((l) => l.status === 'picked').length;
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'block w-full rounded-2xl border p-4 text-left transition-[background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.99]',
        active
          ? 'border-brand-300 bg-surface shadow-lg shadow-brand-900/8'
          : 'border-line bg-surface/70 hover:border-brand-200 hover:bg-surface',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="cifras text-lg font-semibold">PKL {pickList.number}</span>
        {pickList.status === 'returned' && <Badge tone="danger">Con errores</Badge>}
        {pickList.status === 'validating' && <Badge tone="warning">En validación</Badge>}
        {pickList.openStop && <Badge tone="warning">En parada</Badge>}
      </div>
      <p className="mt-0.5 truncate text-sm text-muted">
        {pickList.orders.map((o) => o.clientName).join(', ')}
      </p>
      <Progress value={lines.length ? done / lines.length : 0} className="mt-3" tone={done === lines.length ? 'success' : 'brand'} />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="cifras text-muted">
          {done}/{lines.length} líneas
        </span>
        {pickList.dueAt && (
          <span className={cn('flex items-center gap-1.5 font-medium', hot ? 'text-danger' : 'text-muted')}>
            {hot && <span aria-hidden className="pulsa size-1.5 rounded-full bg-danger" />}
            {formatRemaining(new Date(pickList.dueAt).getTime() - now)}
          </span>
        )}
      </div>
    </button>
  );
}

function PickListWork({
  pickList,
  causes,
  token,
  now,
  onChange,
  onDelivered,
}: {
  pickList: PickList;
  causes: StopCause[];
  token: string;
  now: number;
  onChange: (p: PickList) => void;
  onDelivered: () => void;
}) {
  const [stopOpen, setStopOpen] = useState(false);
  const [pendingLine, setPendingLine] = useState<string | null>(null);
  const { busy, run } = useAction();

  const lines = linesOf(pickList);
  const live = lines.filter((l) => l.status !== 'cancelled');
  const picked = live.filter((l) => l.status === 'picked').length;
  const missing = live.filter((l) => l.status === 'not_found').length;
  const readOnly = pickList.status === 'validating';
  const canDeliver = !readOnly && live.length > 0 && picked === live.length;
  const errorsByLine = useMemo(() => {
    const map = new Map<string, PickList['errors']>();
    for (const e of pickList.errors) map.set(e.lineId, [...(map.get(e.lineId) ?? []), e]);
    return map;
  }, [pickList.errors]);

  async function mark(line: OrderLine, status: LineMark) {
    setPendingLine(line.id);
    // Respuesta inmediata en pantalla; si el servidor la rechaza, vuelve el estado real.
    onChange({
      ...pickList,
      orders: pickList.orders.map((o) => ({
        ...o,
        lines: o.lines.map((l) => (l.id === line.id ? { ...l, status } : l)),
      })),
    });
    let result: PickList = pickList;
    await run(async () => {
      result = await pickListsApi.markLine(token, pickList.id, line.id, status);
    });
    onChange(result);
    setPendingLine(null);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="border-b border-line p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="cifras text-2xl font-semibold tracking-tight">PKL {pickList.number}</h1>
          <span className="cifras text-sm text-muted">
            {pickList.orders.length} {pickList.orders.length === 1 ? 'pedido' : 'pedidos'} · {live.reduce((s, l) => s + l.quantity, 0)} unidades
          </span>
          {pickList.status === 'assigned' && !readOnly && (
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              loading={busy}
              onClick={() => run(async () => onChange(await pickListsApi.start(token, pickList.id)))}
            >
              <PlayCircle size={15} aria-hidden />
              Empezar
            </Button>
          )}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Progress value={live.length ? picked / live.length : 0} className="h-3 flex-1" tone={canDeliver ? 'success' : 'brand'} />
          <span className="cifras text-sm font-semibold">
            {picked}/{live.length}
          </span>
        </div>
      </header>

      {pickList.openStop && (
        <div className="entra flex flex-wrap items-center gap-4 border-b border-warning/20 bg-warning-soft px-5 py-4">
          <PauseCircle size={22} className="text-warning" aria-hidden />
          <div className="mr-auto">
            <p className="font-semibold text-warning">En parada: {pickList.openStop.causeName}</p>
            <p className="cifras text-sm text-warning/80">
              {formatElapsed(now - new Date(pickList.openStop.startedAt).getTime())}
            </p>
          </div>
          <Button
            variant="warning"
            loading={busy}
            onClick={() => run(async () => onChange(await pickListsApi.endStop(token, pickList.id)), 'Parada cerrada')}
          >
            <PlayCircle size={16} aria-hidden />
            Retomar
          </Button>
        </div>
      )}

      {pickList.status === 'returned' && pickList.errors.length > 0 && (
        <div className="flex items-start gap-3 border-b border-danger/20 bg-danger-soft px-5 py-4 text-danger">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">Volvió de validación.</span> Corregí las líneas marcadas y
            entregalo de nuevo.
          </p>
        </div>
      )}

      {readOnly && (
        <div className="flex items-center gap-3 border-b border-line bg-brand-50 px-5 py-4 text-brand-800">
          <PackageCheck size={20} aria-hidden />
          <p className="text-sm font-medium">Entregado. Esperando al validador.</p>
        </div>
      )}

      <div className="divide-y divide-line">
        {pickList.orders.map((order) => (
          <div key={order.id} className="px-5 py-4">
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
              <span className="cifras">{order.externalId}</span>
              <span className="font-medium text-ink">{order.clientName}</span>
              {order.notes && <span className="text-warning">· {order.notes}</span>}
            </p>
            <ul className="escalona mt-3 space-y-2">
              {order.lines.map((line) => (
                <LineRow
                  key={line.id}
                  line={line}
                  errors={errorsByLine.get(line.id)}
                  disabled={readOnly || pendingLine === line.id}
                  onMark={(status) => mark(line, status)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!readOnly && (
        <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-line bg-surface/95 p-4 backdrop-blur md:flex-nowrap">
          <Button
            variant="warning"
            size="lg"
            disabled={!!pickList.openStop}
            onClick={() => setStopOpen(true)}
          >
            <PauseCircle size={18} aria-hidden />
            Registrar parada
          </Button>
          <p className="min-w-0 flex-1 text-center text-sm text-muted">
            {missing > 0
              ? `${missing} ${missing === 1 ? 'producto no encontrado' : 'productos no encontrados'}: esperá a inventario o a la baja de televentas.`
              : canDeliver
                ? 'Todo alistado.'
                : `Faltan ${live.length - picked} líneas.`}
          </p>
          <Button
            size="lg"
            disabled={!canDeliver}
            loading={busy && canDeliver}
            onClick={async () => {
              if (await run(() => pickListsApi.deliver(token, pickList.id), `PKL ${pickList.number} entregado al validador`)) {
                onDelivered();
              }
            }}
          >
            <PackageCheck size={18} aria-hidden />
            Entregar a validación
          </Button>
        </footer>
      )}

      <StopDrawer
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        causes={causes}
        onPick={async (causeId, note) => {
          const ok = await run(
            async () => onChange(await pickListsApi.startStop(token, pickList.id, causeId, note || undefined)),
            'Parada registrada',
          );
          if (ok) setStopOpen(false);
        }}
      />
    </section>
  );
}

function LineRow({
  line,
  errors,
  disabled,
  onMark,
}: {
  line: OrderLine;
  errors?: PickList['errors'];
  disabled: boolean;
  onMark: (status: LineMark) => void;
}) {
  if (line.status === 'cancelled') {
    return (
      <li className="flex items-center gap-4 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
        <span className="flex-1 line-through">{line.productName}</span>
        <span>Dada de baja por televentas</span>
      </li>
    );
  }

  const picked = line.status === 'picked';
  const missing = line.status === 'not_found';
  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 transition-[background-color,border-color] duration-200',
        picked ? 'border-success/25 bg-success-soft/60' : missing ? 'border-danger/30 bg-danger-soft/60' : errors ? 'border-danger/40' : 'border-line',
      )}
    >
      <span className={cn('cifras w-14 text-center text-2xl font-semibold', picked && 'text-success')}>
        {line.quantity}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium', picked && 'text-muted')}>{line.productName}</p>
        <p className="cifras mt-0.5 text-xs text-muted">
          {line.productCode} · lote <span className="font-semibold text-ink">{line.lot}</span>
          {line.expiresOn && ` · vence ${formatDay(line.expiresOn)}`}
        </p>
        {errors?.map((e) => (
          <p key={e.id} className="mt-1 text-xs font-medium text-danger">
            Error de validación: {e.errorType} · {e.units} u{e.note ? ` · ${e.note}` : ''}
          </p>
        ))}
        {missing && <p className="mt-1 text-xs font-medium text-danger">Reportado a inventario</p>}
      </div>
      <div className="flex items-center gap-2">
        {picked || missing ? (
          <>
            {missing && (
              <Button size="md" variant="secondary" disabled={disabled} onClick={() => onMark('picked')}>
                <Check size={16} aria-hidden />
                Apareció
              </Button>
            )}
            <Button size="md" variant="ghost" disabled={disabled} onClick={() => onMark('pending')} aria-label="Deshacer">
              <Undo2 size={16} aria-hidden />
              Deshacer
            </Button>
          </>
        ) : (
          <>
            <Button size="md" variant="secondary" disabled={disabled} onClick={() => onMark('not_found')}>
              <SearchX size={16} aria-hidden />
              No está
            </Button>
            <Button size="md" disabled={disabled} onClick={() => onMark('picked')} className="min-w-32">
              <Check size={16} aria-hidden />
              Alistada
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

/** Elegir la causa es un solo toque; la nota es opcional y nunca obligatoria. */
function StopDrawer({
  open,
  onClose,
  causes,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  causes: StopCause[];
  onPick: (causeId: string, note: string) => void;
}) {
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) setNote('');
  }, [open]);

  return (
    <Drawer open={open} onClose={onClose} title="Registrar parada" subtitle="Elegí la causa.">
      {causes.length === 0 ? (
        <p className="text-sm text-muted">
          Todavía no hay causas cargadas. Pedile al supervisor que las cargue en Configuración.
        </p>
      ) : (
        <div className="grid gap-2">
          {causes.map((cause) => (
            <button
              key={cause.id}
              onClick={() => onPick(cause.id, note)}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line px-4 text-left font-medium transition-[background-color,border-color,transform] duration-150 hover:border-warning/40 hover:bg-warning-soft active:scale-[0.99]"
            >
              {cause.name}
              <PauseCircle size={18} className="shrink-0 text-warning" aria-hidden />
            </button>
          ))}
        </div>
      )}
      <label className="mt-6 block text-sm font-medium" htmlFor="stopNote">
        Nota <span className="font-normal text-muted">(opcional)</span>
      </label>
      <Input id="stopNote" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" />
    </Drawer>
  );
}
