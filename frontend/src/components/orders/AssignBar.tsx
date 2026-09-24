'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserRoundCheck, X } from 'lucide-react';
import { pickListsApi, type OrderRow, type Picker } from '@/lib/api';
import { Combobox } from '@/components/ui';
import { useMounted } from '@/components/ui/useMounted';
import { cn } from '@/lib/cn';
import { useAction } from '@/lib/useLive';

/** Aparece al seleccionar pedidos: los junta en un PKL y lo asigna de una vez. */
export function AssignBar({
  orders,
  pickers,
  token,
  onClear,
  onDone,
  openSignal,
}: {
  orders: OrderRow[];
  pickers: Picker[];
  token: string;
  onClear: () => void;
  onDone: () => void;
  /** Abre el selector de alistador, cuando la selección llega arrastrando tarjetas. */
  openSignal?: number;
}) {
  const [pickerId, setPickerId] = useState('');
  const { busy, run } = useAction();
  const mounted = useMounted();
  const open = orders.length > 0;
  const units = orders.reduce((s, o) => s + o.units, 0);
  const picker = pickers.find((p) => p.id === pickerId);

  if (!mounted) return null;

  // En el body por la misma razón que el panel lateral: la posición fija tiene que ser la de la ventana.
  return createPortal(
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 transition-[translate,opacity,visibility] duration-300 ease-[var(--ease-out)] md:pl-60',
        open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-full opacity-0',
      )}
      aria-hidden={!open}
    >
      <div className="flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-2xl bg-brand-950 p-3 pl-5 text-white shadow-2xl shadow-brand-950/30">
        <div className="mr-auto">
          <p className="text-sm font-medium">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <p className="cifras text-xs text-white/60">{units} unidades</p>
        </div>
        <div className="w-60">
          <Combobox
            tone="dark"
            size="sm"
            className="h-10"
            value={pickerId}
            onChange={setPickerId}
            openSignal={openSignal}
            aria-label="Alistador"
            placeholder="Elegí un alistador"
            searchPlaceholder="Buscar alistador…"
            options={pickers.map((p) => ({ value: p.id, label: p.fullName, hint: p.accountName }))}
          />
        </div>
        <button
          disabled={!picker || busy}
          onClick={async () => {
            if (!picker) return;
            const ok = await run(
              () => pickListsApi.create(token, orders.map((o) => o.id), picker.id),
              `PKL asignado a ${picker.fullName}`,
            );
            if (ok) {
              setPickerId('');
              onDone();
            }
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-brand-300 px-4 text-sm font-semibold text-brand-950 transition-[background-color,transform,opacity] duration-150 hover:bg-brand-200 active:scale-[0.97] disabled:opacity-40"
        >
          <UserRoundCheck size={16} aria-hidden />
          Armar PKL y asignar
        </button>
        <button
          onClick={onClear}
          aria-label="Quitar selección"
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
