'use client';

import { useState } from 'react';
import { OctagonPause, Plus, Power } from 'lucide-react';
import { stopCausesApi } from '@/lib/api';
import { Badge, Button, EmptyState, Field, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAction, useLive } from '@/lib/useLive';

export function StopCausesPanel({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { data, reload } = useLive(token, stopCausesApi.list, (e) => e.type.startsWith('stop_cause.'));
  const [name, setName] = useState('');
  const [attributable, setAttributable] = useState<'' | 'yes' | 'no'>('');
  const { busy, run } = useAction();

  return (
    <div>
      <p className="max-w-prose text-sm text-muted">
        El catálogo del que elige el alistador al registrar una parada. Solo las causas que no
        dependen de él descuentan de su tiempo.
      </p>

      {canEdit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !attributable) return;
            const ok = await run(
              () => stopCausesApi.create(token, name, attributable === 'yes'),
              `Causa ${name.trim()} agregada`,
            );
            if (ok) {
              setName('');
              setAttributable('');
              void reload();
            }
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <Field label="Causa" htmlFor="causeName" className="grow basis-64">
            <Input id="causeName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Espera de inventario" />
          </Field>
          {/* Sin valor por defecto: la clasificación no se puede corregir después, así que se elige a conciencia. */}
          <Field label="¿Depende del alistador?" htmlFor="attributable" className="basis-60">
            <Select id="attributable" value={attributable} onChange={(e) => setAttributable(e.target.value as '' | 'yes' | 'no')}>
              <option value="" disabled>
                Elegí una opción
              </option>
              <option value="no">No, descuenta del tiempo</option>
              <option value="yes">Sí, no descuenta</option>
            </Select>
          </Field>
          <Button type="submit" disabled={!name.trim() || !attributable} loading={busy}>
            <Plus size={16} aria-hidden />
            Agregar causa
          </Button>
        </form>
      )}

      {data && data.length === 0 ? (
        <EmptyState
          icon={OctagonPause}
          title="Todavía no hay causas"
          description="Sin causas cargadas el alistador no puede registrar paradas."
          className="mt-5"
        />
      ) : (
        <ul className="escalona mt-5 grid gap-2 sm:grid-cols-2">
          {(data ?? []).map((cause) => (
            <li
              key={cause.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-opacity duration-200',
                !cause.active && 'opacity-60',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{cause.name}</p>
                <p className="mt-1">
                  {cause.attributable ? (
                    <Badge tone="warning">Depende del alistador</Badge>
                  ) : (
                    <Badge tone="brand">No depende, descuenta</Badge>
                  )}
                  {!cause.active && <Badge className="ml-1.5">Desactivada</Badge>}
                </p>
              </div>
              {canEdit && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => stopCausesApi.setActive(token, cause.id, !cause.active))) void reload();
                  }}
                  aria-label={cause.active ? `Desactivar ${cause.name}` : `Reactivar ${cause.name}`}
                  title={cause.active ? 'Desactivar' : 'Reactivar'}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  <Power size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted">
        Una causa no se edita ni se borra: cambiarle la clasificación alteraría el tiempo de turnos
        ya cerrados. Si quedó mal cargada, se desactiva y se crea otra.
      </p>
    </div>
  );
}
