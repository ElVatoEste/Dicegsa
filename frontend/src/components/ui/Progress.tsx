import { cn } from '@/lib/cn';

/** Avance de 0 a 1. Se anima con escala y no con ancho, para no recalcular el diseño. */
export function Progress({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'success' }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn('h-2 overflow-hidden rounded-full bg-brand-100', className)}
    >
      <div
        className={cn(
          'h-full origin-left rounded-full transition-transform duration-500 ease-[var(--ease-out)]',
          tone === 'success' ? 'bg-success' : 'bg-brand-500',
        )}
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}
