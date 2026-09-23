'use client';

import { KeyRound, MessageSquareText, X } from 'lucide-react';
import type { ResetRequest } from '@/lib/api';
import { Badge, Button } from '@/components/ui';
import { formatDateTime } from '@/lib/time';

/** Solicitudes de cambio de contraseña hechas desde el ingreso y todavía sin atender. */
export function ResetRequestsPanel({
  requests,
  busy,
  onReset,
  onDismiss,
}: {
  requests: ResetRequest[];
  busy: boolean;
  onReset: (request: ResetRequest) => void;
  onDismiss: (request: ResetRequest) => void;
}) {
  const pending = requests.filter((r) => r.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <section className="entra mb-8 overflow-hidden rounded-xl border border-warning/30 bg-warning-soft/50">
      <header className="flex items-center gap-2 border-b border-warning/20 px-5 py-3">
        <KeyRound size={16} className="text-warning" aria-hidden />
        <h2 className="text-sm font-semibold text-warning">Solicitudes de cambio de contraseña</h2>
        <span className="cifras ml-1 rounded-md bg-warning px-1.5 text-xs leading-5 text-white">{pending.length}</span>
      </header>
      <ul className="escalona divide-y divide-warning/15">
        {pending.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{request.accountName}</span>
                {!request.accountId && <Badge tone="danger">No existe esa cuenta</Badge>}
                <span className="text-xs text-muted">{formatDateTime(request.createdAt)}</span>
              </p>
              {request.note && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                  <MessageSquareText size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {request.note}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {request.accountId && (
                <Button size="sm" disabled={busy} onClick={() => onReset(request)}>
                  <KeyRound size={14} aria-hidden />
                  Reiniciar contraseña
                </Button>
              )}
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDismiss(request)}>
                <X size={14} aria-hidden />
                Descartar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
