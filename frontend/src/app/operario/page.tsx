'use client';

import { ClipboardList } from 'lucide-react';
import { useAuthGuard } from '@/components/AuthGuard';
import { Shell } from '@/components/Shell';
import { EmptyState } from '@/components/ui';

/** Vista del alistador. Corre en las computadoras compartidas del almacén. */
export default function OperatorPage() {
  const session = useAuthGuard(['operator']);
  if (!session) return null;

  return (
    <Shell title="Mis órdenes" role={session.role} accountName={session.accountName}>
      <EmptyState
        icon={ClipboardList}
        title="No tenés órdenes asignadas"
        description="Cuando el supervisor te asigne una orden aparece acá."
      />
    </Shell>
  );
}
