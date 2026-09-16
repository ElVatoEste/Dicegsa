import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface', className)}>{children}</div>
  );
}
