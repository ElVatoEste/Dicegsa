'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, authApi, type SystemRole } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/Toasts';
import { Button, Field, PasswordInput } from '@/components/ui';
import { homeFor } from '@/lib/nav';
import { clearSession, readSession, saveSession } from '@/lib/session';

const MIN_LENGTH = 8;

export default function ChangePasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<SystemRole | null>(null);
  const [accountName, setAccountName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace('/');
      return;
    }
    setToken(session.token);
    setRole(session.role);
    setAccountName(session.accountName);
  }, []);

  const tooShort = newPassword.length > 0 && newPassword.length < MIN_LENGTH;
  const mismatch = repeated.length > 0 && repeated !== newPassword;
  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= MIN_LENGTH && repeated === newPassword;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canSubmit || !role) return;
    setSubmitting(true);
    try {
      const { token: fresh } = await authApi.changePassword(token, currentPassword, newPassword);
      saveSession({ token: fresh, accountName, role, mustChangePassword: false });
      toast.success('Contraseña actualizada');
      router.replace(homeFor(role));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo size="lg" />

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Elegí tu contraseña</h1>
        <p className="mt-1 text-sm text-muted">
          Por seguridad, cambiá la contraseña temporal antes de continuar.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Contraseña entregada" htmlFor="current">
            <PasswordInput
              id="current"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>

          <Field
            label="Contraseña nueva"
            htmlFor="new"
            hint={`Al menos ${MIN_LENGTH} caracteres. No se piden mayúsculas ni símbolos.`}
            error={tooShort ? `Le faltan ${MIN_LENGTH - newPassword.length} caracteres.` : undefined}
          >
            <PasswordInput
              id="new"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>

          <Field
            label="Repetila"
            htmlFor="repeated"
            error={mismatch ? 'Las dos no coinciden.' : undefined}
          >
            <PasswordInput
              id="repeated"
              value={repeated}
              onChange={(e) => setRepeated(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>

          <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full">
            Guardar y continuar
          </Button>
        </form>

        <button
          onClick={() => {
            clearSession();
            router.replace('/');
          }}
          className="mt-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
