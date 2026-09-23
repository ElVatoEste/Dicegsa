'use client';

import { useState } from 'react';
import { OctagonPause, Plus, Power } from 'lucide-react';
import { stopCausesApi } from '@/lib/api';
import { Badge, Button, Combobox, EmptyState, Field, Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAction, useLive } from '@/lib/useLive';

export function StopCausesPanel({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { data, reload } = useLive(token, stopCausesApi.list, (e) => e.type.startsWith('stop_cause.'));
  const [name, setName] = useState('');
  const [attributable, setAttributable] = useState<'' | 'yes' | 'no'>('');
  const { busy, run } = useAction();

  return (
    <div>
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
          className="flex flex-wrap items-end gap-3"
        >
          <Field label="Causa" htmlFor="causeName" className="grow basis-64">
            <Input id="causeName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Espera de inventario" />
          </Field>
          {/* Sin valor por defecto: la clasificación no se puede corregir después, así que se elige a conciencia. */}
          <Field label="¿Depende del alistador?" htmlFor="attributable" className="basis-60">
            <Combobox
              id="attributable"
              value={attributable}
              onChange={setAttributable}
              options={[
                { value: 'no', label: 'No, descuenta del tiempo' },
                { value: 'yes', label: 'Sí, no descuenta' },
              ]}
            />
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
    </div>
  );
}
