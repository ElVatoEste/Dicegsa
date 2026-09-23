import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Ocupa la caja que ocuparía el listado, así el alto de la pantalla no salta al
 * pasar de con datos a sin datos.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-xl border border-line bg-surface px-6 py-16 text-center', className)}
    >
      <span
        aria-hidden
        className="mx-auto grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600"
      >
        <Icon size={20} />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
