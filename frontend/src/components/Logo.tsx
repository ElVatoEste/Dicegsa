import { cn } from '@/lib/cn';

const SIZES = {
  md: { mark: 38, name: 'text-lg', place: 'text-[13px]', gap: 'gap-3' },
  lg: { mark: 52, name: 'text-2xl', place: 'text-sm', gap: 'gap-3.5' },
} as const;

/**
 * Marca de la aplicación. El isotipo es una espiral cuadrada, la forma del
 * logotipo de DICEGSA; no es el archivo oficial. Cuando esté el SVG de marca se
 * reemplaza este componente por una imagen y el resto no cambia.
 */
export function Logo({ tone = 'light', size = 'md' }: { tone?: 'light' | 'dark'; size?: keyof typeof SIZES }) {
  const onDark = tone === 'dark';
  const s = SIZES[size];
  return (
    <span className={cn('flex items-center', s.gap)}>
      <svg width={s.mark} height={s.mark} viewBox="0 0 30 30" aria-hidden className="shrink-0">
        <rect
          x="1.5"
          y="1.5"
          width="27"
          height="27"
          rx="5"
          fill={onDark ? 'rgba(255,255,255,0.10)' : 'var(--color-brand-50)'}
        />
        <path
          d="M8 22V11.5A3.5 3.5 0 0 1 11.5 8H22"
          fill="none"
          stroke={onDark ? '#ffffff' : 'var(--color-brand-700)'}
          strokeWidth="2"
          strokeLinecap="square"
        />
        <path
          d="M12 22v-6.5a3 3 0 0 1 3-3H22"
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
          strokeLinecap="square"
        />
        <circle cx="18.5" cy="18" r="2" fill="var(--color-brand-500)" />
      </svg>
      <span className="leading-none">
        <span className={cn('block font-bold tracking-tight', s.name, onDark ? 'text-white' : 'text-ink')}>
          Dicegsa
        </span>
        <span className={cn('mt-1 block font-medium', s.place, onDark ? 'text-white/65' : 'text-muted')}>
          Almacén CDF
        </span>
      </span>
    </span>
  );
}
