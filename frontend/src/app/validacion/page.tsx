'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Minus, Plus, TriangleAlert, Undo2, X } from 'lucide-react';
import {
  catalogsApi,
  pickListsApi,
  type CatalogEntry,
  type OrderLine,
  type PickList,
  type ValidationErrorInput,
} from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { Shell } from '@/components/Shell';
import { Button, EmptyState, Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/time';
import { useAction, useLive } from '@/lib/useLive';

interface Queue {
  pickLists: PickList[];
  errorTypes: CatalogEntry[];
}

async function loadQueue(token: string): Promise<Queue> {
  const [pickLists, errorTypes] = await Promise.all([
    pickListsApi.validationQueue(token),
    catalogsApi.list(token, 'error_type'),
  ]);
  return { pickLists, errorTypes: errorTypes.filter((t) => t.active) };
}

export default function ValidationPage() {
  const session = useAuthGuard(['validator', 'supervisor', 'admin']);
  const token = session?.token;
  const { data, reload, connection } = useLive(token, loadQueue, (e) => e.type.startsWith('pick_list.'));
  const [activeId, setActiveId] = useState<string | null>(null);

  const queue = data?.pickLists ?? [];
  const active = queue.find((p) => p.id === activeId) ?? queue[0] ?? null;
  const canValidate = session?.role === 'validator';

  if (!session || !token) return null;

  return (
    <Shell
      title="Validación"
      role={session.role}
      accountName={session.accountName}
      connection={connection}
    >
      {!data ? (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="h-32 animate-pulse rounded-2xl bg-surface" />
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
        </div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nada para validar"
          description="Cuando un alistador entregue un PKL, aparece acá."
        />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
          <nav aria-label="PKL por validar" className="escalona space-y-2 lg:sticky lg:top-6">
            <p className="px-1 text-xs font-semibold text-muted">Por validar · {queue.length}</p>
            {queue.map((p) => {
              const lines = p.orders.flatMap((o) => o.lines).filter((l) => l.status !== 'cancelled');
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  aria-current={p.id === active?.id ? 'true' : undefined}
                  className={cn(
                    'block w-full rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.99]',
                    p.id === active?.id
                      ? 'border-brand-300 bg-surface shadow-lg shadow-brand-900/8'
                      : 'border-line bg-surface/70 hover:border-brand-200 hover:bg-surface',
                  )}
                >
                  <span className="cifras block text-lg font-semibold">PKL {p.number}</span>
                  <span className="block truncate text-sm text-muted">{p.assignee?.name ?? 'Sin alistador'}</span>
                  <span className="cifras mt-2 block text-xs text-muted">
                    {lines.length} líneas · {lines.reduce((s, l) => s + l.quantity, 0)} unidades
                  </span>
                </button>
              );
            })}
          </nav>
          {active && (
            <Review
              key={active.id}
              pickList={active}
              errorTypes={data.errorTypes}
              token={token}
              canValidate={canValidate}
              onDone={reload}
            />
          )}
        </div>
      )}
    </Shell>
  );
}

type Draft = ValidationErrorInput & { key: number; typeName: string };

function Review({
  pickList,
  errorTypes,
  token,
  canValidate,
  onDone,
}: {
  pickList: PickList;
  errorTypes: CatalogEntry[];
  token: string;
  canValidate: boolean;
  onDone: () => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const { busy, run } = useAction();

  const byLine = useMemo(() => {
    const map = new Map<string, Draft[]>();
    for (const d of drafts) map.set(d.lineId, [...(map.get(d.lineId) ?? []), d]);
    return map;
  }, [drafts]);

  async function finish() {
    const errors = drafts.map(({ lineId, errorTypeId, units, note }) => ({ lineId, errorTypeId, units, note }));
    const ok = await run(
      () => pickListsApi.validate(token, pickList.id, errors),
      errors.length
        ? `PKL ${pickList.number} devuelto a ${pickList.assignee?.name ?? 'su alistador'}`
        : `PKL ${pickList.number} validado`,
    );
    if (ok) onDone();
  }

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="flex flex-wrap items-center gap-3 border-b border-line p-5">
        <h2 className="cifras text-2xl font-semibold tracking-tight">PKL {pickList.number}</h2>
        <span className="text-sm text-muted">Alistó {pickList.assignee?.name ?? '—'}</span>
      </header>

      <div className="divide-y divide-line">
        {pickList.orders.map((order) => (
          <div key={order.id} className="px-5 py-4">
            <p className="flex gap-2 text-xs text-muted">
              <span className="cifras">{order.externalId}</span>
              <span className="font-medium text-ink">{order.clientName}</span>
            </p>
            <ul className="mt-3 space-y-2">
              {order.lines
                .filter((l) => l.status !== 'cancelled')
                .map((line) => (
                  <li
                    key={line.id}
                    className={cn(
                      'rounded-xl border px-4 py-3 transition-[border-color,background-color] duration-200',
                      byLine.has(line.id) ? 'border-danger/35 bg-danger-soft/40' : 'border-line',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="cifras w-12 text-center text-xl font-semibold">{line.quantity}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{line.productName}</p>
                        <p className="cifras mt-0.5 text-xs text-muted">
                          {line.productCode} · lote <span className="font-semibold text-ink">{line.lot}</span>
                          {line.expiresOn && ` · vence ${formatDay(line.expiresOn)}`}
                        </p>
                      </div>
                      {canValidate && editing !== line.id && (
                        <Button variant="secondary" size="sm" onClick={() => setEditing(line.id)}>
                          <TriangleAlert size={14} aria-hidden />
                          Marcar error
                        </Button>
                      )}
                    </div>
                    {byLine.get(line.id)?.map((d) => (
                      <p key={d.key} className="entra mt-2 flex items-center gap-2 pl-16 text-sm text-danger">
                        <span className="font-medium">{d.typeName}</span>
                        <span className="cifras">· {d.units} u</span>
                        {d.note && <span className="text-danger/80">· {d.note}</span>}
                        <button
                          onClick={() => setDrafts((all) => all.filter((x) => x.key !== d.key))}
                          aria-label="Quitar este error"
                          className="ml-1 rounded p-1 text-danger/60 transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <X size={13} />
                        </button>
                      </p>
                    ))}
                    {editing === line.id && (
                      <ErrorForm
                        line={line}
                        errorTypes={errorTypes}
                        onCancel={() => setEditing(null)}
                        onAdd={(draft) => {
                          setDrafts((all) => [...all, { ...draft, key: Date.now() }]);
                          setEditing(null);
                        }}
                      />
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {canValidate && (
        <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-line bg-surface/95 p-4 backdrop-blur">
          <p className="mr-auto text-sm text-muted">
            {drafts.length
              ? `${drafts.length} ${drafts.length === 1 ? 'error' : 'errores'}: vuelve al mismo alistador para corregir.`
              : 'Sin errores, el PKL se cierra y pasa a despacho.'}
          </p>
          {drafts.length > 0 ? (
            <Button variant="danger" size="lg" loading={busy} onClick={finish}>
              <Undo2 size={18} aria-hidden />
              Devolver con {drafts.length} {drafts.length === 1 ? 'error' : 'errores'}
            </Button>
          ) : (
            <Button size="lg" loading={busy} onClick={finish} className="bg-success hover:bg-success/90">
              <CheckCircle2 size={18} aria-hidden />
              Validar y empacar
            </Button>
          )}
        </footer>
      )}
    </section>
  );
}

function ErrorForm({
  line,
  errorTypes,
  onCancel,
  onAdd,
}: {
  line: OrderLine;
  errorTypes: CatalogEntry[];
  onCancel: () => void;
  onAdd: (draft: Omit<Draft, 'key'>) => void;
}) {
  const [typeId, setTypeId] = useState('');
  const [units, setUnits] = useState(1);
  const [note, setNote] = useState('');
  const type = errorTypes.find((t) => t.id === typeId);

  return (
    <div className="entra mt-3 rounded-xl bg-canvas p-4">
      <p className="text-xs font-semibold text-muted">Tipo de error</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {errorTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeId(t.id)}
            aria-pressed={t.id === typeId}
            className={cn(
              'h-10 rounded-lg border px-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
              t.id === typeId
                ? 'border-danger bg-danger text-white'
                : 'border-line bg-surface hover:border-danger/40 hover:text-danger',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">Unidades con error</p>
          <div className="mt-2 flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
            <button
              onClick={() => setUnits((u) => Math.max(1, u - 1))}
              aria-label="Una menos"
              className="grid size-8 place-items-center rounded-md transition-colors hover:bg-canvas active:scale-90"
            >
              <Minus size={14} />
            </button>
            <span className="cifras w-10 text-center font-semibold">{units}</span>
            <button
              onClick={() => setUnits((u) => Math.min(line.quantity, u + 1))}
              aria-label="Una más"
              className="grid size-8 place-items-center rounded-md transition-colors hover:bg-canvas active:scale-90"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <label className="min-w-48 flex-1">
          <span className="text-xs font-semibold text-muted">Nota (opcional)</span>
          <Input size="sm" value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" />
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!type}
            onClick={() =>
              type && onAdd({ lineId: line.id, errorTypeId: type.id, typeName: type.name, units, note: note || undefined })
            }
          >
            Agregar error
          </Button>
        </div>
      </div>
    </div>
  );
}
