'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMounted } from './useMounted';

export interface ComboOption<T extends string = string> {
  value: T;
  label: string;
  /** Texto chico a la derecha: un código, una cantidad. */
  hint?: string;
  disabled?: boolean;
}

const HEIGHTS = { sm: 'h-9 text-sm', md: 'h-11 text-base', lg: 'h-13 text-base' } as const;
const PANEL_MAX = 300;

/** Compara sin tildes ni mayúsculas: "Cuarto frio" encuentra "Cuarto frío". */
function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Desplegable propio con buscador. El panel se monta en el body y se posiciona
 * contra la ventana: dentro de un panel lateral con scroll, un menú absoluto
 * quedaría recortado.
 */
export function Combobox<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Elegí una opción',
  searchPlaceholder = 'Buscar…',
  size = 'md',
  disabled,
  id,
  className,
  tone = 'light',
  openSignal,
  'aria-label': ariaLabel,
}: {
  value: T | '';
  onChange: (value: T) => void;
  options: ComboOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  size?: keyof typeof HEIGHTS;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** `dark` para usarlo sobre fondos oscuros, como la barra de asignación. */
  tone?: 'light' | 'dark';
  /** Cada cambio de este número abre el desplegable desde afuera, por ejemplo al soltar una tarjeta. */
  openSignal?: number;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ top?: number; bottom?: number; left: number; width: number; up: boolean }>();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const mounted = useMounted();
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? options.filter((o) => normalize(`${o.label} ${o.hint ?? ''}`).includes(q)) : options;
  }, [options, query]);

  function place_() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 280);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    const up = window.innerHeight - rect.bottom < PANEL_MAX + 16 && rect.top > window.innerHeight - rect.bottom;
    setPlace(up ? { bottom: window.innerHeight - rect.top + 6, left, width, up } : { top: rect.bottom + 6, left, width, up });
  }

  useLayoutEffect(() => {
    if (!open) return;
    place_();
    const onMove = () => place_();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    // Solo al abrir: mientras está abierto la lista la maneja el teclado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function choose(option: ComboOption<T> | undefined) {
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === 'Escape') {
      // Cierra solo el desplegable, no el panel lateral que lo contiene.
      e.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  const dark = tone === 'dark';

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border px-3 text-left outline-none transition-[border-color,box-shadow,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-55',
          dark
            ? 'border-white/15 bg-white/10 text-white hover:bg-white/15 focus-visible:border-brand-300'
            : 'border-line bg-surface hover:border-brand-200 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/12',
          open && !dark && 'border-brand-500 ring-4 ring-brand-500/12',
          HEIGHTS[size],
          className,
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selected && (dark ? 'text-white/60' : 'text-muted'))}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn('shrink-0 transition-transform duration-200', dark ? 'text-white/60' : 'text-muted', open && 'rotate-180')}
        />
      </button>

      {mounted &&
        open &&
        place &&
        createPortal(
          <div
            ref={panel}
            onKeyDown={onKey}
            style={{ top: place.top, bottom: place.bottom, left: place.left, width: place.width }}
            className={cn(
              'fixed z-[70] overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl shadow-brand-950/15',
              'transition-[opacity,scale] duration-150 ease-[var(--ease-out)] starting:scale-[0.97] starting:opacity-0',
              place.up ? 'origin-bottom' : 'origin-top',
            )}
          >
            <label className="flex items-center gap-2 border-b border-line px-3">
              <Search size={15} className="shrink-0 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted focus-visible:outline-none"
              />
            </label>
            <ul ref={list} id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">Sin resultados</li>
              ) : (
                filtered.map((option, i) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(option)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm',
                        i === active && 'bg-brand-50',
                        isSelected && 'font-medium text-brand-800',
                        option.disabled && 'cursor-not-allowed opacity-45',
                      )}
                    >
                      <Check size={15} aria-hidden className={cn('shrink-0 text-brand-600', !isSelected && 'invisible')} />
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.hint && <span className="cifras shrink-0 text-xs text-muted">{option.hint}</span>}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
