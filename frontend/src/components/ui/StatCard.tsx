import type { LucideIcon } from 'lucide-react';

/** Cifra grande con su etiqueta. El valor va en mono para que no cambie de ancho. */
export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      {Icon && (
        <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </span>
      )}
      <p className="cifras mt-3 text-3xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted">{unit}</span>}
      </p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
    </div>
  );
}
