'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMounted } from './useMounted';

/**
 * Panel lateral para el detalle o un formulario sin salir de la lista. Queda
 * montado aunque esté cerrado, así la salida también anima y quien lo cierra ve
 * a dónde vuelve.
 *
 * Se monta en el body: dentro de la página, un contenedor animado con transform
 * pasaría a ser la referencia de la posición fija y el panel quedaría recortado.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const titleId = useId();
  // En una referencia: las pantallas pasan una función nueva en cada render, y como
  // dependencia del efecto le robaría el foco al campo que se está escribiendo.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    // Al cerrar, el foco vuelve a donde estaba: quien usa teclado no pierde su lugar.
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current();
      if (e.key !== 'Tab' || !panel.current) return;
      // Mientras está abierto, Tab recorre solo el panel y no lo que quedó detrás del velo.
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-brand-950/30 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-2xl shadow-brand-950/20 outline-none',
          'transition-[translate,visibility] duration-300 ease-[var(--ease-drawer)]',
          wide ? 'max-w-2xl' : 'max-w-lg',
          open ? 'visible translate-x-0' : 'invisible translate-x-full',
        )}
      >
        <header className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="-mr-2 rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="border-t border-line bg-canvas/60 px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
