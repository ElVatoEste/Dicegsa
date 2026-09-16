'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { api, ErrorApi } from '@/lib/api';
import { guardarSesion } from '@/lib/sesion';

export default function Login() {
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await api.login(nombreCuenta, password);
      guardarSesion(sesion);
      window.location.href = sesion.debeCambiarPassword
        ? '/cambiar-password/'
        : sesion.rol === 'admin'
          ? '/cuentas/'
          : '/tablero/';
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo conectar con el servidor');
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-tight">CDF · DICEGSA</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Evaluación operativa</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Ingresá con el nombre de cuenta que te entregó el administrador.
          </p>
        </div>

        <form onSubmit={enviar} className="rounded-xl border border-linea bg-panel p-6 shadow-sm">
          <label className="block text-sm font-medium" htmlFor="nombreCuenta">
            Nombre de cuenta
          </label>
          <input
            id="nombreCuenta"
            value={nombreCuenta}
            onChange={(e) => setNombreCuenta(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />

          <label className="mt-5 block text-sm font-medium" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-alerta-suave px-3 py-2.5 text-sm text-alerta"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accion px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <LogIn size={16} aria-hidden />
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-tinta-suave">
          ¿Olvidaste la contraseña? El administrador la reinicia y te la entrega.
        </p>
      </div>
    </div>
  );
}
