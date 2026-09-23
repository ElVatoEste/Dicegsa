import { cn } from '@/lib/cn';

/**
 * Marca de la aplicación. El isotipo es una espiral cuadrada, la forma del
 * logotipo de DICEGSA; no es el archivo oficial. Cuando esté el SVG de marca se
 * reemplaza este componente por una imagen y el resto no cambia.
 */
export function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const onDark = tone === 'dark';
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="shrink-0">
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
        <span
          className={cn(
            'block text-[15px] font-bold tracking-tight',
            onDark ? 'text-white' : 'text-ink',
          )}
        >
          Dicegsa
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[11px] font-medium',
            onDark ? 'text-white/55' : 'text-muted',
          )}
        >
          Almacén CDF
        </span>
      </span>
    </span>
  );
}
