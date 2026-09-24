'use client';

import { MapPin } from 'lucide-react';
import type { OrderRow } from '@/lib/api';
import { Badge, Checkbox } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRemaining } from '@/lib/time';
import type { Urgency } from './urgency';

/** Tarjeta de un pedido en el tablero. Todo lo que decide la prioridad se lee sin abrirla. */
export function OrderCard({
  order,
  urgency,
  now,
  zoneName,
  selectable,
  selected,
  onSelect,
  onOpen,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}: {
  order: OrderRow;
  urgency: Urgency;
  now: number;
  zoneName: Map<string, string>;
  selectable: boolean;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onOpen: () => void;
  draggable?: boolean;
  /** La tarjeta es parte de lo que se está arrastrando. */
  dragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const hot = urgency !== 'normal' && order.status !== 'done';
  const initials = order.assignee?.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <li
      data-order={order.externalId}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-surface p-3.5 pl-4 text-sm outline-none',
        'transition-[border-color,box-shadow,translate,opacity,scale] duration-150 hover:-translate-y-px hover:shadow-md hover:shadow-brand-900/8',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        dragging && 'scale-[0.98] opacity-40',
        'has-[button:focus-visible]:ring-4 has-[button:focus-visible]:ring-brand-500/20',
        selected ? 'border-brand-400 ring-2 ring-brand-300/60' : hot ? 'border-danger/30' : 'border-line hover:border-brand-200',
      )}
    >
      {/*
        Abrir ocupa toda la tarjeta, pero como botón hermano y no contenedor: un botón
        no puede tener otro adentro, y la casilla de selección tiene que ser su propio control.
      */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir pedido ${order.externalId} de ${order.clientName}`}
        className="absolute inset-0 z-0 outline-none"
      />
      {/* Franja de urgencia: se ve sin leer la tarjeta. */}
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 w-1', hot ? 'bg-danger' : order.status === 'done' ? 'bg-success/60' : 'bg-transparent')}
      />

      <div className="flex items-start gap-2.5">
        {selectable && (
          <span className="relative z-10 pt-0.5">
            <Checkbox label={`Seleccionar pedido ${order.externalId}`} checked={selected} onChange={onSelect} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between gap-2">
            <span className="cifras text-xs text-muted">{order.externalId}</span>
            <span className="cifras text-xs font-semibold">{order.units} u</span>
          </p>
          <p className="mt-0.5 truncate font-medium">{order.clientName}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin size={12} className="shrink-0" aria-hidden />
            {order.municipality}, {order.department}
            {order.dispatchZoneId && ` · ${zoneName.get(order.dispatchZoneId)}`}
          </p>
        </div>
      </div>

      {order.inventoryZoneId && (
        <Badge tone="brand" className="mt-2.5 max-w-full truncate">{zoneName.get(order.inventoryZoneId)}</Badge>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className={cn('flex items-center gap-1.5 text-xs font-medium', hot ? 'text-danger' : 'text-muted')}>
          {hot && <span aria-hidden className="pulsa size-1.5 rounded-full bg-danger" />}
          {order.status === 'done' ? 'Validado' : formatRemaining(new Date(order.dueAt).getTime() - now)}
        </span>
        {order.assignee ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted" title={order.assignee.name}>
            <span className="cifras">PKL {order.pickListNumber}</span>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-800">
              {initials}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted">{order.lineCount} {order.lineCount === 1 ? 'línea' : 'líneas'}</span>
        )}
      </div>
    </li>
  );
}
