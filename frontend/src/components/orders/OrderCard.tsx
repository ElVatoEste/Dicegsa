'use client';

import { Check, Clock, MapPin } from 'lucide-react';
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
        'relative rounded-lg border bg-surface p-3 text-sm shadow-xs shadow-brand-950/5 outline-none',
        'transition-[border-color,box-shadow,opacity,scale] duration-150 hover:shadow-sm',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        dragging && 'scale-[0.98] opacity-40',
        'has-[button:focus-visible]:ring-4 has-[button:focus-visible]:ring-brand-500/20',
        selected ? 'border-brand-500 ring-1 ring-brand-500' : 'border-line hover:border-brand-200',
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
        className="absolute inset-0 z-0 rounded-lg outline-none"
      />

      <div className="flex items-center gap-2">
        {selectable && (
          <span className="relative z-10">
            <Checkbox label={`Seleccionar pedido ${order.externalId}`} checked={selected} onChange={onSelect} />
          </span>
        )}
        <span className="cifras text-xs text-muted">{order.externalId}</span>
        <span className="cifras ml-auto text-xs text-muted">
          <span className="font-semibold text-ink">{order.units}</span> u
        </span>
      </div>

      <p className="mt-1.5 truncate font-medium leading-snug">{order.clientName}</p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
        <MapPin size={12} className="shrink-0" aria-hidden />
        <span className="truncate">
          {order.municipality}, {order.department}
          {order.dispatchZoneId && ` · ${zoneName.get(order.dispatchZoneId)}`}
        </span>
      </p>

      {order.inventoryZoneId && (
        <Badge className="mt-2 max-w-full">
          <span className="truncate">{zoneName.get(order.inventoryZoneId)}</span>
        </Badge>
      )}

      <div className="mt-3 flex items-center gap-2">
        {order.status === 'done' ? (
          <Badge tone="success">
            <Check size={12} strokeWidth={2.5} aria-hidden />
            Validado
          </Badge>
        ) : hot ? (
          <Badge tone="danger" className="shrink-0">
            <span aria-hidden className="pulsa size-1.5 rounded-full bg-danger" />
            {formatRemaining(new Date(order.dueAt).getTime() - now)}
          </Badge>
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
            <Clock size={12} aria-hidden />
            {formatRemaining(new Date(order.dueAt).getTime() - now)}
          </span>
        )}
        {order.assignee ? (
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted" title={order.assignee.name}>
            <span className="cifras">PKL {order.pickListNumber}</span>
            <span className="grid size-6 place-items-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-800">
              {initials}
            </span>
          </span>
        ) : (
          <span className="ml-auto shrink-0 text-xs text-muted">
            {order.lineCount} {order.lineCount === 1 ? 'línea' : 'líneas'}
          </span>
        )}
      </div>
    </li>
  );
}
