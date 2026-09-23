'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, PackagePlus } from 'lucide-react';
import { ordersApi, type CatalogEntry } from '@/lib/api';
import { Button, Drawer, Field, Input, Select } from '@/components/ui';
import { parseLines } from '@/lib/paste';
import { formatDay, fromLocalInput, toLocalInput } from '@/lib/time';
import { useAction } from '@/lib/useLive';

const EMPTY = {
  externalId: '',
  clientCode: '',
  clientName: '',
  department: '',
  municipality: '',
  notes: '',
  dispatchZoneId: '',
  inventoryZoneId: '',
};

/**
 * Alta de un pedido tal como lo ve mesa de control en el ERP: los datos del
 * encabezado y las líneas pegadas desde la pestaña de contenido.
 */
export function NewOrderDrawer({
  open,
  onClose,
  token,
  dispatchZones,
  inventoryZones,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  dispatchZones: CatalogEntry[];
  inventoryZones: CatalogEntry[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [receivedAt, setReceivedAt] = useState(() => toLocalInput(new Date().toISOString()));
  const [dueAt, setDueAt] = useState('');
  const [pasted, setPasted] = useState('');
  const { busy, run } = useAction();

  const parsed = useMemo(() => parseLines(pasted), [pasted]);
  const units = parsed.lines.reduce((sum, l) => sum + l.quantity, 0);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const ready =
    form.externalId.trim() &&
    form.clientCode.trim() &&
    form.clientName.trim() &&
    form.department.trim() &&
    form.municipality.trim() &&
    dueAt &&
    parsed.lines.length > 0 &&
    parsed.errors.length === 0;

  async function submit() {
    const ok = await run(
      () =>
        ordersApi.create(token, {
          ...form,
          notes: form.notes || undefined,
          dispatchZoneId: form.dispatchZoneId || undefined,
          inventoryZoneId: form.inventoryZoneId || undefined,
          receivedAt: fromLocalInput(receivedAt),
          dueAt: fromLocalInput(dueAt),
          lines: parsed.lines,
        }),
      `Pedido ${form.externalId} cargado`,
    );
    if (ok) {
      setForm(EMPTY);
      setPasted('');
      setDueAt('');
      setReceivedAt(toLocalInput(new Date().toISOString()));
      onCreated();
      onClose();
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title="Nuevo pedido"
      subtitle="Copiá los datos del pedido desde el ERP."
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="cifras text-sm text-muted">
            {parsed.lines.length} líneas · {units} unidades
          </p>
          <Button onClick={submit} disabled={!ready} loading={busy}>
            <PackagePlus size={16} aria-hidden />
            Cargar pedido
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Id de pedido" htmlFor="externalId">
          <Input id="externalId" value={form.externalId} onChange={set('externalId')} className="cifras" />
        </Field>
        <Field label="Llegó" htmlFor="receivedAt">
          <Input id="receivedAt" type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        </Field>
        <Field label="Id de cliente" htmlFor="clientCode">
          <Input id="clientCode" value={form.clientCode} onChange={set('clientCode')} className="cifras" />
        </Field>
        <Field label="Cliente" htmlFor="clientName">
          <Input id="clientName" value={form.clientName} onChange={set('clientName')} />
        </Field>
        <Field label="Departamento" htmlFor="department">
          <Input id="department" value={form.department} onChange={set('department')} placeholder="Managua" />
        </Field>
        <Field label="Municipio" htmlFor="municipality">
          <Input id="municipality" value={form.municipality} onChange={set('municipality')} />
        </Field>
        <Field label="Entregar antes de" htmlFor="dueAt">
          <Input id="dueAt" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
        <Field label="Zona de despacho" htmlFor="dispatchZoneId">
          <Select id="dispatchZoneId" value={form.dispatchZoneId} onChange={set('dispatchZoneId')}>
            <option value="">Sin asignar</option>
            {dispatchZones.filter((z) => z.active).map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Zona de inventario" htmlFor="inventoryZoneId">
          <Select id="inventoryZoneId" value={form.inventoryZoneId} onChange={set('inventoryZoneId')}>
            <option value="">Sin asignar</option>
            {inventoryZones.filter((z) => z.active).map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notas de televentas" htmlFor="notes">
          <Input id="notes" value={form.notes} onChange={set('notes')} placeholder="Cambio de dirección…" />
        </Field>
      </div>

      <div className="mt-6">
        <label htmlFor="lines" className="flex items-center gap-2 text-sm font-medium">
          <ClipboardPaste size={15} className="text-brand-600" aria-hidden />
          Contenido del pedido
        </label>
        <p className="mt-1 text-xs text-muted">
          Seleccioná las filas en la pestaña de contenido del ERP y pegalas acá: id de producto,
          nombre, cantidad, lote y vence.
        </p>
        <textarea
          id="lines"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={4}
          spellCheck={false}
          className="cifras mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
        />

        {parsed.errors.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-danger">
            {parsed.errors.map((e) => (
              <li key={e.row}>Fila {e.row}: {e.reason}</li>
            ))}
          </ul>
        )}

        {parsed.lines.length > 0 && (
          <ul className="escalona mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {parsed.lines.map((line, i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                <span className="cifras w-20 shrink-0 text-xs text-muted">{line.productCode}</span>
                <span className="min-w-0 flex-1 truncate">{line.productName}</span>
                <span className="cifras shrink-0 text-xs text-muted">
                  {line.lot}
                  {line.expiresOn && ` · ${formatDay(line.expiresOn)}`}
                </span>
                <span className="cifras w-12 shrink-0 text-right font-semibold">{line.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
