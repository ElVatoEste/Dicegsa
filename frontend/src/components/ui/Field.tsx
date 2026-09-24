import { cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  // La ayuda o el error se leen junto con el campo: un lector de pantalla los
  // anuncia al entrar, no solo quien los ve debajo.
  const noteId = htmlFor && (error || hint) ? `${htmlFor}-nota` : undefined;
  const control =
    noteId && isValidElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(children)
      ? cloneElement(children, { 'aria-describedby': noteId, 'aria-invalid': error ? true : undefined })
      : children;

  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{control}</div>
      {(error || hint) && (
        <p id={noteId} className={cn('mt-1.5 text-xs', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

const base =
  'w-full rounded-lg border border-line bg-surface px-3 outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12';

// El alto se elige acá y no por className: `h-9` y `h-11` pesan lo mismo, así que
// mandarlas juntas deja que gane la del stylesheet y no la de quien la escribió.
const HEIGHTS = { sm: 'h-9 text-sm', md: 'h-11 text-base', lg: 'h-13 text-base' } as const;

// `size` ya existe como atributo nativo de input, y ahí es un número.
// Se lo excluye para que el del kit sea el que vale.
type WithSize<T> = Omit<T, 'size'> & { size?: keyof typeof HEIGHTS };

export function Input({
  size = 'md',
  className,
  ...props
}: WithSize<React.InputHTMLAttributes<HTMLInputElement>>) {
  return <input {...props} className={cn(base, HEIGHTS[size], className)} />;
}
