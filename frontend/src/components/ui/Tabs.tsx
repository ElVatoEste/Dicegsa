'use client';

import { cn } from '@/lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Resalta el contador cuando lo que cuenta pide atención. */
  alert?: boolean;
}

/**
 * Pestañas que filtran una vista. El contador de cada una dice cuánto hay antes de
 * entrar, así la cola se lee sin recorrerla.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]',
              active ? 'bg-brand-900 text-white' : 'text-muted hover:bg-brand-50 hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'cifras min-w-5 rounded-md px-1.5 text-center text-xs leading-5',
                  option.alert && option.count > 0
                    ? 'bg-danger text-white'
                    : active
                      ? 'bg-white/15 text-white'
                      : 'bg-canvas text-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
