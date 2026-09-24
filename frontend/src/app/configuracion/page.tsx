'use client';

import { useEffect, useState } from 'react';
import { Clock, Gauge, Timer, type LucideIcon } from 'lucide-react';
import { catalogsApi, type CatalogKind, type Settings } from '@/lib/api';
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

const PARAMETERS: {
  key: keyof Settings;
  title: string;
  hint: string;
  unit: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    key: 'urgentThresholdMinutes',
    title: 'Pronta entrega',
    hint: 'Cuánto antes de la entrega un pedido pasa a marcarse en rojo.',
    unit: 'minutos',
    icon: Timer,
    tone: 'bg-danger-soft text-danger',
  },
  {
    key: 'workdayHours',
    title: 'Jornada',
    hint: 'Horas por día trabajado. El método vigente divide productos y unidades por este número.',
    unit: 'horas',
    icon: Clock,
    tone: 'bg-brand-100 text-brand-700',
  },
  {
    key: 'standardLinesPerHour',
    title: 'Estándar de desempeño',
    hint: 'Líneas por hora que se espera de un alistador. Es la base del factor de desempeño.',
    unit: 'líneas/h',
    icon: Gauge,
    tone: 'bg-brand-100 text-brand-700',
  },
];

function Parameters({ token, canEdit }: { token: string; canEdit: boolean }) {
  const { data, setData } = useLive(token, catalogsApi.settings, (e) => e.type === 'settings.changed');
  return (
    <div className="escalona grid max-w-3xl gap-4">
      {PARAMETERS.map((p) => (
        <Parameter key={p.key} def={p} value={data?.[p.key]} canEdit={canEdit} token={token} onSaved={setData} />
      ))}
    </div>
  );
}

function Parameter({
  def,
  value,
  canEdit,
  token,
  onSaved,
}: {
  def: (typeof PARAMETERS)[number];
  value: number | undefined;
  canEdit: boolean;
  token: string;
  onSaved: (s: Settings) => void;
}) {
  const [draft, setDraft] = useState('');
  const { busy, run } = useAction();
  const Icon = def.icon;

  useEffect(() => {
    if (value !== undefined) setDraft(String(value));
  }, [value]);

  const parsed = Number(draft);
  const changed = value !== undefined && Number.isFinite(parsed) && parsed > 0 && parsed !== value;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${def.tone}`}>
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{def.title}</p>
        <p className="mt-0.5 text-sm text-muted">{def.hint}</p>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!changed) return;
          await run(async () => onSaved(await catalogsApi.saveSetting(token, def.key, parsed)), `${def.title} guardado`);
        }}
      >
        <div className="w-24">
          <Input
            type="number"
            min={1}
            step="any"
            value={draft}
            disabled={!canEdit}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={def.title}
            className="cifras"
          />
        </div>
        <span className="w-16 text-sm text-muted">{def.unit}</span>
        {canEdit && (
          <Button type="submit" size="sm" disabled={!changed} loading={busy}>
            Guardar
          </Button>
        )}
      </form>
    </div>
  );
}
