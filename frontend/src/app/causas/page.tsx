'use client';

import { useCallback, useEffect, useState } from 'react';
import { OctagonPause, Plus, Power } from 'lucide-react';
import { ApiError, stopCausesApi, type StopCause } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Shell } from '@/components/Shell';
import { useToast } from '@/components/Toasts';
import { Badge, Button, EmptyState, Field, Input, Select, Table, Td, Th } from '@/components/ui';
import { useRealtime } from '@/lib/events';

export default function StopCausesPage() {
  const session = useAuthGuard(['supervisor', 'management', 'admin']);
  const [causes, setCauses] = useState<StopCause[]>([]);
  const [newName, setNewName] = useState('');
  const [attributable, setAttributable] = useState<'' | 'yes' | 'no'>('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const token = session?.token;
  const canEdit = session?.role === 'supervisor' || session?.role === 'admin';

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setCauses(await stopCausesApi.list(token));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo leer el catálogo');
    }
    // toast viene de un contexto estable; incluirlo rearmaría el efecto en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const connection = useRealtime(token, (event) => {
    if (event.type.startsWith('stop_cause.')) void reload();
  });

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo completar la operación');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <Shell
      title="Causas de parada"
      subtitle="El catálogo del que se elige al registrar un bloqueo. Solo las causas no imputables descuentan de la Disponibilidad."
      role={session.role}
      accountName={session.accountName}
      status={<ConnectionStatus state={connection} />}
    >
      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!token || !newName.trim() || !attributable) return;
            void run(async () => {
              const created = await stopCausesApi.create(token, newName, attributable === 'yes');
              toast.success(`Causa ${created.name} agregada`);
              setNewName('');
              setAttributable('');
            });
          }}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-5"
        >
          <Field label="Causa" htmlFor="newName" className="grow basis-56">
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Quiebre de stock en la ubicación"
            />
          </Field>
          {/* Sin valor por defecto: la clasificación no se puede corregir después, así que se elige a conciencia. */}
          <Field label="¿Depende del alistador?" htmlFor="attributable" className="basis-56">
            <Select
              id="attributable"
              value={attributable}
              onChange={(e) => setAttributable(e.target.value as '' | 'yes' | 'no')}
            >
              <option value="" disabled>
                Elegí una opción
              </option>
              <option value="no">No, descuenta del tiempo</option>
              <option value="yes">Sí, no descuenta</option>
            </Select>
          </Field>
          <Button type="submit" disabled={!newName.trim() || !attributable} loading={busy}>
            <Plus size={16} aria-hidden />
            Agregar causa
          </Button>
        </form>
      )}

      {causes.length === 0 ? (
        <EmptyState
          icon={OctagonPause}
          title="Todavía no hay causas"
          description="El catálogo sale del diagnóstico en el piso: qué traba al alistador y cuánto dura."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Causa</Th>
              <Th>Clasificación</Th>
              <Th>Estado</Th>
              {canEdit && <Th className="text-right">Acciones</Th>}
            </tr>
          </thead>
          <tbody>
            {causes.map((cause) => (
              <tr key={cause.id}>
                <Td>
                  <span className="font-medium">{cause.name}</span>
                </Td>
                <Td>
                  {cause.attributable ? (
                    <Badge tone="warning">Imputable</Badge>
                  ) : (
                    <Badge tone="brand">No imputable, descuenta</Badge>
                  )}
                </Td>
                <Td>
                  {cause.active ? (
                    <Badge tone="success">En uso</Badge>
                  ) : (
                    <Badge tone="neutral">Desactivada</Badge>
                  )}
                </Td>
                {canEdit && (
                  <Td>
                    <div className="flex justify-end">
                      <Button
                        variant={cause.active ? 'danger' : 'secondary'}
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (!token) return;
                          void run(() => stopCausesApi.setActive(token, cause.id, !cause.active));
                        }}
                      >
                        <Power size={14} aria-hidden />
                        {cause.active ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-4 text-xs text-muted">
        Una causa no se edita ni se borra: cambiarle la clasificación alteraría el OLE de turnos ya
        cerrados. Si quedó mal cargada, se desactiva y se crea otra.
      </p>
    </Shell>
  );
}
