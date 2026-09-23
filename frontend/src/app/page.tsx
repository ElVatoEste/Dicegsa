'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, authApi } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/Toasts';
import { Button, Field, Input, PasswordInput } from '@/components/ui';
import { homeFor } from '@/lib/nav';
import { saveSession } from '@/lib/session';

export default function LoginPage() {
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const session = await authApi.login(accountName, password);
      saveSession(session);
      router.replace(session.mustChangePassword ? '/cambiar-password/' : homeFor(session.role));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor');
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-950 lg:block">
        <img
          src="/login.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        {/* Velo de marca: el logo se lee sobre la foto sin importar qué quede detrás. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-brand-950/80 via-brand-950/25 to-brand-950/70"
        />
        <div className="relative p-12">
          <Logo tone="dark" size="lg" />
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo size="lg" />
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Ingresar</h1>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Nombre de cuenta" htmlFor="accountName">
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </Field>

            <Field label="Contraseña" htmlFor="password">
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Ingresando' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted">Acceso restringido al personal autorizado de DICEGSA.</p>
        </div>
      </div>
    </div>
  );
}
