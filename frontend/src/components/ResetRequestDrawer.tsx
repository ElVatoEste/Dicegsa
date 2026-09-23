'use client';

import { useEffect, useState } from 'react';
import { MailCheck, Send, UserRound } from 'lucide-react';
import { resetRequestsApi } from '@/lib/api';
import { Button, Drawer, IconInput } from '@/components/ui';
import { useAction } from '@/lib/useLive';

/** Pedido de cambio de contraseña al administrador, desde el ingreso y sin sesión. */
export function ResetRequestDrawer({
  open,
  onClose,
  initialAccount,
}: {
  open: boolean;
  onClose: () => void;
  initialAccount: string;
}) {
  const [accountName, setAccountName] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, run } = useAction();

  useEffect(() => {
    if (!open) return;
    setAccountName(initialAccount);
    setNote('');
    setSent(false);
  }, [open, initialAccount]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Solicitar cambio de contraseña"
      subtitle="La solicitud le llega al administrador."
      footer={
        sent ? (
          <Button className="w-full" onClick={onClose}>
            Volver al ingreso
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            disabled={!accountName.trim()}
            loading={busy}
            onClick={async () => {
              if (await run(() => resetRequestsApi.send(accountName, note || undefined))) setSent(true);
            }}
          >
            <Send size={17} aria-hidden />
            Enviar solicitud
          </Button>
        )
      }
    >
      {sent ? (
        <div className="entra flex flex-col items-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <MailCheck size={26} aria-hidden />
          </span>
          <p className="mt-5 text-lg font-semibold">Solicitud enviada</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            El administrador te va a entregar una contraseña temporal.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label htmlFor="resetAccount" className="text-sm font-medium">
              Nombre de cuenta
            </label>
            <div className="mt-2">
              <IconInput
                id="resetAccount"
                icon={UserRound}
                size="lg"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
          <div>
            <label htmlFor="resetNote" className="text-sm font-medium">
              Comentario <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              id="resetNote"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Ej.: turno de la tarde, área de picking"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
            />
            <p className="cifras mt-1 text-right text-xs text-muted">{note.length}/300</p>
          </div>
        </div>
      )}
    </Drawer>
  );
}
