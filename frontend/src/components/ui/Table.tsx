import { cn } from '@/lib/cn';

// La tabla desborda en horizontal antes que apretar las columnas: un listado de
// cuentas con el nombre cortado no sirve para decidir nada.
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[46rem] text-sm [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-canvas/60">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'border-b border-line px-4 py-3 text-left text-xs font-semibold text-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('border-b border-line px-4 py-3', className)}>{children}</td>;
}
