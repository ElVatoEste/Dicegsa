'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { catalogsApi, type CatalogKind } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { Shell } from '@/components/Shell';
import { CatalogPanel } from '@/components/settings/CatalogPanel';
import { StopCausesPanel } from '@/components/settings/StopCausesPanel';
import { Button, Input, Tabs } from '@/components/ui';
import { CATALOG_LABEL } from '@/lib/labels';
import { useAction, useLive } from '@/lib/useLive';

type Section = 'stop_causes' | CatalogKind | 'parameters';

export default function SettingsPage() {
  const session = useAuthGuard(['supervisor', 'management', 'admin']);
  const [section, setSection] = useState<Section>('stop_causes');
  const token = session?.token;
  const canEdit = session?.role === 'supervisor' || session?.role === 'admin';

  if (!session || !token) return null;

  return (
    <Shell
      title="Configuración"
      subtitle="Los valores de la operación viven acá y no en el código. Todo cambio queda en la auditoría."
      role={session.role}
      accountName={session.accountName}
    >
      <Tabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'stop_causes', label: 'Causas de parada' },
          { value: 'dispatch_zone', label: CATALOG_LABEL.dispatch_zone.title },
          { value: 'inventory_zone', label: CATALOG_LABEL.inventory_zone.title },
          { value: 'error_type', label: CATALOG_LABEL.error_type.title },
          { value: 'parameters', label: 'Parámetros' },
        ]}
      />
      {/* La clave remonta el panel: cada sección entra con su propia animación. */}
      <div key={section} className="entra mt-6">
        {section === 'stop_causes' ? (
          <StopCausesPanel token={token} canEdit={canEdit} />
        ) : section === 'parameters' ? (
          <Parameters token={token} canEdit={canEdit} />
        ) : (
          <CatalogPanel kind={section} token={token} canEdit={canEdit} />
        )}
      </div>
    </Shell>
  );
}

function Parameters({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { data, setData } = useLive(token, catalogsApi.settings, (e) => e.type === 'settings.changed');
  const [minutes, setMinutes] = useState('');
  const { busy, run } = useAction();

  useEffect(() => {
    if (data) setMinutes(String(data.urgentThresholdMinutes));
  }, [data]);

  const value = Number(minutes);
  const valid = Number.isInteger(value) && value > 0;
  const changed = data && valid && value !== data.urgentThresholdMinutes;

  return (
    <div className="max-w-xl rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
          <Timer size={18} aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Pronta entrega</p>
          <p className="mt-0.5 text-sm text-muted">
            Cuánto antes de la entrega un pedido pasa a marcarse en rojo en la vista de mesa de control.
          </p>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!changed) return;
              await run(async () => setData(await catalogsApi.saveSetting(token, 'urgentThresholdMinutes', value)), 'Umbral guardado');
            }}
          >
            <Input
              type="number"
              min={1}
              value={minutes}
              disabled={!canEdit}
              onChange={(e) => setMinutes(e.target.value)}
              aria-label="Minutos antes de la entrega"
              className="cifras w-28"
            />
            <span className="text-sm text-muted">minutos</span>
            {canEdit && (
              <Button type="submit" disabled={!changed} loading={busy} className="ml-auto">
                Guardar
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
