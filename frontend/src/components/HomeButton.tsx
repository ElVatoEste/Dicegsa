'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { homeFor } from '@/lib/nav';
import { readSession } from '@/lib/session';

/** Con sesión abierta lleva a la pantalla del rol; sin sesión, al ingreso. */
export function HomeButton({ className }: { className?: string }) {
  const router = useRouter();
  const [home, setHome] = useState('/');

  useEffect(() => {
    const session = readSession();
    if (session) setHome(homeFor(session.role));
  }, []);

  return (
    <Button size="lg" className={className} onClick={() => router.replace(home)}>
      <ArrowLeft size={18} aria-hidden />
      Volver al inicio
    </Button>
  );
}
