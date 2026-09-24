'use client';

import { useMemo, useState } from 'react';
import { ChartColumn, PauseCircle, TriangleAlert } from 'lucide-react';
import { metricsApi, type MetricsReport, type WorkerRow } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { Shell } from '@/components/Shell';
import { Badge, Drawer, EmptyState, Tabs } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLive } from '@/lib/useLive';

type Range = 'today' | 'week' | 'month' | 'thirty';

/** Fecha local AAAA-MM-DD del equipo. */
function day(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function rangeOf(range: Range): { from: string; to: string } {
  const today = new Date();
  const to = day(today);
  if (range === 'today') return { from: to, to };
  if (range === 'week') return { from: day(new Date(today.getTime() - 6 * 86_400_000)), to };
  if (range === 'thirty') return { from: day(new Date(today.getTime() - 29 * 86_400_000)), to };
  return { from: day(new Date(today.getFullYear(), today.getMonth(), 1)), to };
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
const num = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? '—' : v.toLocaleString('es-NI', { maximumFractionDigits: digits });

export default function MetricsPage() {
  const session = useAuthGuard(['supervisor', 'management', 'admin']);
  const token = session?.token;
  const [range, setRange] = useState<Range>('today');
  const period = useMemo(() => rangeOf(range), [range]);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, connection } = useLive(
    token,
    (t) => metricsApi.report(t, period.from, period.to),
    (e) => e.type.startsWith('pick_list.'),
    `${period.from}:${period.to}`,
  );
  // Mientras llega el período nuevo no se muestran las cifras del anterior.
  const shown = data && data.period.from === period.from && data.period.to === period.to ? data : null;

  if (!session || !token) return null;

  const active = shown?.workers.filter((w) => w.metrics) ?? [];
  const idle = shown?.workers.filter((w) => !w.metrics) ?? [];
  const open = shown?.workers.find((w) => w.id === openId) ?? null;

  return (
    <Shell title="Métricas" role={session.role} accountName={session.accountName} connection={connection}>
      <Tabs<Range>
        value={range}
        onChange={setRange}
        options={[
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Últimos 7 días' },
          { value: 'month', label: 'Este mes' },
          { value: 'thirty', label: 'Últimos 30 días' },
        ]}
      />

      {!shown ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : (
        <div key={`${period.from}-${period.to}`} className="entra">
          <General report={shown} />

          <h2 className="mt-10 text-lg font-semibold tracking-tight">Por colaborador</h2>
          {active.length === 0 ? (
            <EmptyState icon={ChartColumn} title="Sin actividad en el período" className="mt-4" />
          ) : (
            <WorkersTable workers={active} onOpen={setOpenId} />
          )}
          {idle.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Sin actividad en el período: {idle.map((w) => w.name).join(', ')}.
            </p>
          )}
        </div>
      )}

      <WorkerDrawer worker={open} settings={shown?.settings} onClose={() => setOpenId(null)} />
    </Shell>
  );
}

function General({ report }: { report: MetricsReport }) {
  const t = report.totals;
  const errorRate = t.units ? t.errorUnits / t.units : null;
  return (
    <>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* El número que resume el período; los factores que lo componen, al lado. */}
        <section className="rounded-2xl bg-brand-950 p-6 text-white">
          <p className="text-sm text-white/60">OLE promedio</p>
          <p className="cifras mt-2 text-5xl font-semibold tracking-tight">{pct(t.ole)}</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Factor label="Disponibilidad" value={t.availability} dark />
            <Factor label="Desempeño" value={t.performance} dark />
            <Factor label="Calidad" value={t.quality} dark />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">Método vigente</p>
          <p className="mt-0.5 text-xs text-muted">Sobre {report.settings.workdayHours} h por día trabajado, sin descontar paradas.</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="cifras text-3xl font-semibold">{num(t.linesPerHour)}</p>
              <p className="text-sm text-muted">productos por hora</p>
            </div>
            <div>
              <p className="cifras text-3xl font-semibold">{num(t.unitsPerHour)}</p>
              <p className="text-sm text-muted">unidades por hora</p>
            </div>
          </div>
          <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
            Estándar: {report.settings.standardLinesPerHour} líneas por hora
          </p>
        </section>
      </div>

      <div className="escalona mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Tile label="Pedidos finalizados" value={num(t.ordersDone, 0)} />
        <Tile label="Líneas alistadas" value={num(t.lines, 0)} />
        <Tile label="Unidades" value={num(t.units, 0)} />
        <Tile
          label="Errores"
          value={num(t.errorCount, 0)}
          detail={errorRate === null ? undefined : `${num(t.errorUnits, 0)} u · ${pct(errorRate)} de las unidades`}
        />
        <Tile
          label="Paradas que no dependen del alistador"
          value={`${num(t.excusedStopMinutes / 60)} h`}
          detail={`${t.activeWorkers} ${t.activeWorkers === 1 ? 'colaborador activo' : 'colaboradores activos'}`}
        />
      </div>
    </>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="cifras text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </div>
  );
}

function Factor({ label, value, dark }: { label: string; value: number | null; dark?: boolean }) {
  return (
    <div>
      <p className={cn('text-xs', dark ? 'text-white/60' : 'text-muted')}>{label}</p>
      <p className="cifras mt-1 text-xl font-semibold">{pct(value)}</p>
      <Meter value={value ?? 0} label={label} dark={dark} className="mt-2" />
    </div>
  );
}

/** Medidor de 0 a 1 en un solo tono: una magnitud, no una categoría ni un estado. */
function Meter({ value, label, dark, className }: { value: number; label: string; dark?: boolean; className?: string }) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn('h-1.5 overflow-hidden rounded-full', dark ? 'bg-white/12' : 'bg-brand-100', className)}
    >
      <div
        className={cn(
          'h-full origin-left rounded-full transition-[scale] duration-500 ease-[var(--ease-out)]',
          dark ? 'bg-brand-300' : 'bg-brand-500',
        )}
        style={{ scale: `${Math.min(1, Math.max(0, value))} 1` }}
      />
    </div>
  );
}

function WorkersTable({ workers, onOpen }: { workers: WorkerRow[]; onOpen: (id: string) => void }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[60rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold text-muted">
            <th className="px-5 py-3">Colaborador</th>
            <th className="px-3 py-3 text-right">Días</th>
            <th className="px-3 py-3 text-right">Líneas</th>
            <th className="px-3 py-3 text-right">Unidades</th>
            <th className="border-l border-line px-3 py-3 text-right" title="Método vigente, sobre horas brutas">
              Líneas/h
            </th>
            <th className="px-3 py-3 text-right" title="Método vigente, sobre horas brutas">
              Unid./h
            </th>
            <th className="border-l border-line px-3 py-3 text-right">D</th>
            <th className="px-3 py-3 text-right">P</th>
            <th className="px-3 py-3 text-right">Q</th>
            <th className="w-44 px-5 py-3">OLE</th>
            <th className="px-5 py-3 text-right">Errores</th>
          </tr>
        </thead>
        <tbody className="escalona">
          {workers.map((w) => {
            const m = w.metrics!;
            return (
              <tr
                key={w.id}
                onClick={() => onOpen(w.id)}
                className="cursor-pointer border-b border-line transition-colors duration-150 last:border-0 hover:bg-brand-50/60"
              >
                <td className="px-5 py-3.5">
                  <span className="font-medium">{w.name}</span>
                  <span className="block text-xs text-muted">{w.accountName}</span>
                </td>
                <td className="cifras px-3 text-right">{w.activity.days}</td>
                <td className="cifras px-3 text-right">{w.activity.lines}</td>
                <td className="cifras px-3 text-right">{w.activity.units}</td>
                <td className="cifras border-l border-line px-3 text-right">{num(m.linesPerHour)}</td>
                <td className="cifras px-3 text-right">{num(m.unitsPerHour)}</td>
                <td className="cifras border-l border-line px-3 text-right">{pct(m.availability)}</td>
                <td className="cifras px-3 text-right">{pct(m.performance)}</td>
                <td className="cifras px-3 text-right">{pct(m.quality)}</td>
                <td className="px-5">
                  <span className="flex items-center gap-3">
                    <span className="cifras w-10 font-semibold">{pct(m.ole)}</span>
                    <Meter value={m.ole} label={`OLE de ${w.name}`} className="flex-1" />
                  </span>
                </td>
                <td className="cifras px-5 text-right">
                  {w.activity.errorCount}
                  {w.activity.errorUnits > 0 && <span className="text-xs text-muted"> · {w.activity.errorUnits} u</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WorkerDrawer({
  worker,
  settings,
  onClose,
}: {
  worker: WorkerRow | null;
  settings?: MetricsReport['settings'];
  onClose: () => void;
}) {
  const [shown, setShown] = useState<WorkerRow | null>(null);
  if (worker && worker !== shown) setShown(worker);
  const w = worker ?? shown;
  const m = w?.metrics;

  return (
    <Drawer open={worker !== null} onClose={onClose} title={w?.name ?? ''} subtitle={w?.accountName}>
      {w && m && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-brand-950 p-5 text-white">
            <p className="text-sm text-white/60">OLE</p>
            <p className="cifras mt-1 text-4xl font-semibold">{pct(m.ole)}</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <Factor label="Disponibilidad" value={m.availability} dark />
              <Factor label="Desempeño" value={m.performance} dark />
              <Factor label="Calidad" value={m.quality} dark />
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Stat label="Jornada" value={`${num(m.shiftHours)} h`} />
            <Stat label="Disponible" value={`${num(m.availableHours)} h`} />
            <Stat label="Líneas por hora (vigente)" value={num(m.linesPerHour)} />
            <Stat label="Unidades por hora (vigente)" value={num(m.unitsPerHour)} />
            <Stat label="Líneas por hora disponible" value={num(m.availableHours ? w.activity.lines / m.availableHours : 0)} />
            <Stat label="Estándar" value={`${settings?.standardLinesPerHour ?? '—'} líneas/h`} />
          </dl>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <PauseCircle size={15} className="text-warning" aria-hidden />
              Paradas
            </h3>
            {w.stopsByCause.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sin paradas en el período.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {w.stopsByCause.map((s) => (
                  <li key={s.cause} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{s.cause}</span>
                    <Badge tone={s.attributable ? 'warning' : 'brand'}>{s.attributable ? 'Depende de él' : 'No descuenta'}</Badge>
                    <span className="cifras w-20 text-right">
                      {s.minutes} min
                      <span className="text-xs text-muted"> · {s.count}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert size={15} className="text-danger" aria-hidden />
              Errores de validación
            </h3>
            {w.errorsByType.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sin errores en el período.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {w.errorsByType.map((e) => (
                  <li key={e.type} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="flex-1">{e.type}</span>
                    <span className="cifras">
                      {e.count} <span className="text-xs text-muted">· {e.units} u</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="cifras mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
