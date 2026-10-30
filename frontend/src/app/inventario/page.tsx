'use client';

import { useEffect, useMemo, useState } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { ApiError, productsApi, type Product } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { Shell } from '@/components/Shell';
import { useToast } from '@/components/Toasts';
import { EmptyState, Input, Table, Td, Th } from '@/components/ui';
import { formatDay } from '@/lib/time';

export default function InventoryPage() {
  const session = useAuthGuard(['control_desk', 'supervisor', 'management', 'admin']);
  const token = session?.token;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!token) return;
    productsApi.list(token).then(setProducts, (e) => {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo leer el inventario');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products ?? [];
    return (products ?? []).filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [products, query]);

  if (!session) return null;

  return (
    <Shell title="Inventario" role={session.role} accountName={session.accountName} wide>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, barra o nombre…"
            className="pl-9"
            aria-label="Buscar producto"
          />
        </div>
        {products && (
          <p className="cifras text-xs text-muted">
            {shown.length} de {products.length} productos
          </p>
        )}
      </div>

      {!products ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-canvas" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No hay productos que coincidan"
          description="Probá con otro código, barra o nombre."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Cód. barra</Th>
              <Th>Nombre</Th>
              <Th>Fabricante</Th>
              <Th>Zona</Th>
              <Th>Lote</Th>
              <Th>Vence</Th>
              <Th className="text-right">Cantidad</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <Td className="cifras">{p.code}</Td>
                <Td className="cifras text-muted">{p.barcode ?? '—'}</Td>
                <Td className="max-w-xs truncate">{p.name}</Td>
                <Td className="text-muted">{p.manufacturer ?? '—'}</Td>
                <Td className="text-muted">{p.zone ?? '—'}</Td>
                <Td className="cifras">{p.lot ?? '—'}</Td>
                <Td className="cifras">{p.expiresOn ? formatDay(p.expiresOn) : '—'}</Td>
                <Td className="cifras text-right font-semibold">{p.quantity}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Shell>
  );
}
