import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-line bg-surface text-ink hover:border-brand-200 hover:bg-brand-50',
  ghost: 'text-muted hover:bg-brand-50 hover:text-ink',
  danger: 'border border-danger/25 bg-danger-soft text-danger hover:bg-danger hover:text-white',
  warning: 'border border-warning/25 bg-warning-soft text-warning hover:bg-warning hover:text-white',
};

// Alturas cómodas para tocar con guantes: un objetivo chico se falla.
const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-14 gap-2.5 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin [animation-duration:0.7s]" />}
      {children}
    </button>
  );
}
