'use client';

import { useState } from 'react';
import { ApiError, authApi } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/Toasts';
import { Button, Field, Input } from '@/components/ui';
import { homeFor } from '@/lib/nav';
import { saveSession } from '@/lib/session';

export default function LoginPage() {
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const session = await authApi.login(accountName, password);
      saveSession(session);
      window.location.href = session.mustChangePassword
        ? '/cambiar-password/'
        : homeFor(session.role);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor');
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-indigo-800 p-12 lg:flex">
        <Logo tone="dark" />
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            El tiempo que no dependió de vos, no te lo descuenta.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Las órdenes se siguen en el tablero y los bloqueos se registran cuando ocurren, así el
            desempeño se mide por lo que cada quien pudo hacer.
          </p>
        </div>
        <div
          aria-hidden
          className="absolute -bottom-32 -right-24 size-96 rounded-full bg-cyan-500/12 blur-3xl"
        />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Ingresar</h1>
          <p className="mt-1 text-sm text-muted">
            Usá el nombre de cuenta que te entregó el administrador.
          </p>

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
              <Input
                id="password"
                type="password"
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

          <p className="mt-8 text-sm text-muted">
            Si olvidaste la contraseña, el administrador la reinicia y te entrega una nueva.
          </p>
        </div>
      </div>
    </div>
  );
}
