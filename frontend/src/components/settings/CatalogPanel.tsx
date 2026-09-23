'use client';

import { useState } from 'react';
import { Plus, Power, Tags } from 'lucide-react';
import { catalogsApi, type CatalogKind } from '@/lib/api';
import { Badge, Button, EmptyState, Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CATALOG_LABEL } from '@/lib/labels';
import { useAction, useLive } from '@/lib/useLive';

/** Catálogo de solo nombre: zonas de despacho, zonas de inventario y tipos de error. */
export function CatalogPanel({ kind, token, canEdit }: { kind: CatalogKind; token: string; canEdit: boolean }) {
  const { data, reload } = useLive(
    token,
    (t) => catalogsApi.list(t, kind),
    (e) => e.type === 'catalog.changed',
  );
  const [name, setName] = useState('');
  const { busy, run } = useAction();
  const label = CATALOG_LABEL[kind];

  return (
    <div>
      <p className="max-w-prose text-sm text-muted">{label.hint}</p>

      {canEdit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            if (await run(() => catalogsApi.create(token, kind, name), `${name.trim()} agregada`)) {
              setName('');
              void reload();
            }
          }}
          className="mt-4 flex max-w-lg gap-2"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Nueva ${label.one}`} aria-label={`Nueva ${label.one}`} />
          <Button type="submit" disabled={!name.trim()} loading={busy}>
            <Plus size={16} aria-hidden />
            Agregar
          </Button>
        </form>
      )}

      {data && data.length === 0 ? (
        <EmptyState icon={Tags} title="Todavía no hay entradas" className="mt-5" />
      ) : (
        <ul className="escalona mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((entry) => (
            <li
              key={entry.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-opacity duration-200',
                !entry.active && 'opacity-60',
              )}
            >
              <span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
              {!entry.active && <Badge>Desactivada</Badge>}
              {canEdit && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => catalogsApi.setActive(token, kind, entry.id, !entry.active))) void reload();
                  }}
                  aria-label={entry.active ? `Desactivar ${entry.name}` : `Reactivar ${entry.name}`}
                  title={entry.active ? 'Desactivar' : 'Reactivar'}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    entry.active ? 'text-muted hover:bg-danger-soft hover:text-danger' : 'text-muted hover:bg-brand-50 hover:text-brand-700',
                  )}
                >
                  <Power size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Las entradas no se borran: se desactivan, para que los pedidos y errores que las usaron las
        sigan mostrando.
      </p>
    </div>
  );
}
