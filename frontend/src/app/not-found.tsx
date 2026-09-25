import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { HomeButton } from '@/components/HomeButton';

export const metadata: Metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6 py-12">
      <div className="entra w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="cifras mt-12 text-7xl font-semibold text-brand-700">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-base text-muted">La dirección no existe o cambió.</p>
        <HomeButton className="mt-10" />
      </div>
    </main>
  );
}
