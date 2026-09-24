'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border transition-[background-color,border-color,transform] duration-150 active:scale-90 disabled:opacity-40',
        on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-surface hover:border-brand-400',
      )}
    >
      <span
        className={cn(
          'transition-[opacity,transform] duration-150 ease-[var(--ease-out)]',
          on ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
      >
        {indeterminate ? <Minus size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />}
      </span>
    </button>
  );
}
