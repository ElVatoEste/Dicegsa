'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { accountsApi, ApiError, type Account, type AdminEvent } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Shell } from '@/components/Shell';
import { useToast } from '@/components/Toasts';
import { Badge, EmptyState } from '@/components/ui';
import { ACTION_LABEL, DETAIL_LABEL, detailValue } from '@/lib/labels';
import { useRealtime } from '@/lib/events';

export default function AuditLogPage() {
  const session = useAuthGuard(['admin']);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const toast = useToast();

  const token = session?.token;

  /**
   * El listado de cuentas se recarga junto con el registro porque un alta trae un id
   * que el mapa de nombres todavía no conoce, y la fila mostraría el id crudo.
   */
  const load = useCallback(
    async (markFresh: boolean) => {
      if (!token) return;
      try {
        const [log, accounts] = await Promise.all([
          accountsApi.auditLog(token),
          accountsApi.list(token),
        ]);
        setNames(new Map(accounts.map((a: Account) => [a.id, a.accountName])));
        setEvents((previous) => {
          if (markFresh) {
            const known = new Set(previous.map((e) => e.id));
            setFresh(new Set(log.filter((e) => !known.has(e.id)).map((e) => e.id)));
          }
          return log;
        });
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'No se pudo leer el registro');
      }
      // toast viene de un contexto estable; incluirlo rearmaría el efecto en cada render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [token],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  // Toda acción administrativa llega por la sala "accounts", así que se recarga el
  // registro en lugar de reconstruirlo desde el evento: el servidor es la fuente.
  const connection = useRealtime(token, (event) => {
    if (event.room === 'accounts') void load(true);
  });

  if (!session) return null;

  const nameOf = (id: string) => names.get(id) ?? id.slice(0, 8);

  return (
    <Shell
      title="Auditoría"
      subtitle="Toda acción de un administrador sobre una cuenta queda acá. Es la contrapartida de que pueda reiniciar la contraseña de cualquiera."
      role={session.role}
      accountName={session.accountName}
      status={<ConnectionStatus state={connection} />}
    >
      {events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Todavía no hay acciones registradas"
          description="Cada alta, reinicio, cambio de rol o baja aparece acá apenas ocurre."
        />
      ) : (
        <ol className="overflow-hidden rounded-xl border border-line bg-surface">
          {events.map((event) => (
            <li
              key={event.id}
              className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-line px-5 py-3.5 text-sm transition-colors duration-500 last:border-0 ${
                fresh.has(event.id) ? 'bg-brand-50' : ''
              }`}
            >
              <span className="font-medium">{nameOf(event.actorId)}</span>
              <span className="text-muted">{ACTION_LABEL[event.action]}</span>
              <span className="font-medium">{nameOf(event.targetAccountId)}</span>
              {event.details && (
                <Badge tone="neutral">
                  {Object.entries(event.details)
                    .map(([key, value]) => `${DETAIL_LABEL[key] ?? key}: ${detailValue(value)}`)
                    .join(', ')}
                </Badge>
              )}
              <time className="cifras ml-auto text-xs text-muted" dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString('es-NI')}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}
