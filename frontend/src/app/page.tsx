'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { ApiError, authApi } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { ResetRequestDrawer } from '@/components/ResetRequestDrawer';
import { useToast } from '@/components/Toasts';
import { Button, Checkbox, IconInput, PasswordInput } from '@/components/ui';
import { homeFor } from '@/lib/nav';
import { rememberAccount, rememberedAccount, saveSession } from '@/lib/session';

export default function LoginPage() {
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const saved = rememberedAccount();
    if (saved) {
      setAccountName(saved);
      setRemember(true);
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const session = await authApi.login(accountName, password);
      rememberAccount(remember ? session.accountName : null);
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
        <img src="/login.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        {/* Velo de marca: el logo se lee sobre la foto sin importar qué quede detrás. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-brand-950/80 via-brand-950/25 to-brand-950/70"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo tone="dark" size="lg" />
          <div>
            <p className="text-4xl font-bold tracking-tight text-white">Centro de Distribución</p>
            <p className="mt-3 text-lg text-white/75">Plataforma de operación del almacén CDF · DICEGSA</p>
            <p className="cifras mt-10 text-xs text-white/55">
              © {new Date().getFullYear()} DICEGSA · Almacén CDF
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="entra w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo size="lg" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="mt-2 text-base text-muted">Inicia sesión para consultar tu operación.</p>

          <form onSubmit={submit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="accountName" className="text-sm font-medium">
                Nombre de cuenta
              </label>
              <div className="mt-2">
                <IconInput
                  id="accountName"
                  icon={UserRound}
                  size="lg"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="text-sm font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-900 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="mt-2">
                <PasswordInput
                  id="password"
                  icon={LockKeyhole}
                  size="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm select-none">
              <Checkbox checked={remember} onChange={setRemember} label="Recordar mi cuenta en este equipo" />
              Recordar mi cuenta en este equipo
            </label>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="group w-full shadow-lg shadow-brand-900/15"
            >
              {submitting ? 'Ingresando' : 'Ingresar'}
              {!submitting && (
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="transition-[translate] duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5"
                />
              )}
            </Button>
          </form>

          <p className="mt-10 flex items-center justify-center gap-2 border-t border-line pt-6 text-sm text-muted">
            <ShieldCheck size={16} aria-hidden />
            Acceso restringido al personal autorizado de DICEGSA.
          </p>
        </div>
      </div>

      <ResetRequestDrawer open={resetOpen} onClose={() => setResetOpen(false)} initialAccount={accountName} />
    </div>
  );
}
