'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api, ErrorApi } from '@/lib/api';
import { borrarSesion, guardarSesion, leerSesion } from '@/lib/sesion';

const LARGO_MINIMO = 8;

export default function CambiarPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const sesion = leerSesion();
    if (!sesion) {
      window.location.href = '/';
      return;
    }
    setToken(sesion.token);
    setRol(sesion.rol);
  }, []);

  const corta = passwordNueva.length > 0 && passwordNueva.length < LARGO_MINIMO;
  const noCoincide = repetida.length > 0 && repetida !== passwordNueva;
  const puedeEnviar =
    passwordActual.length > 0 && passwordNueva.length >= LARGO_MINIMO && repetida === passwordNueva;

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!token || !puedeEnviar) return;
    setError(null);
    setEnviando(true);
    try {
      const { token: nuevo } = await api.cambiarPassword(token, passwordActual, passwordNueva);
      guardarSesion({ token: nuevo, rol: rol as never, debeCambiarPassword: false });
      window.location.href = rol === 'admin' ? '/cuentas/' : '/tablero/';
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo conectar con el servidor');
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Elegí tu contraseña</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          La que te entregaron sirve una sola vez. Hasta cambiarla no se puede entrar al resto del
          sistema.
        </p>

        <form onSubmit={enviar} className="mt-8 rounded-xl border border-linea bg-panel p-6 shadow-sm">
          <label className="block text-sm font-medium" htmlFor="actual">
            Contraseña entregada
          </label>
          <input
            id="actual"
            type="password"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />

          <label className="mt-5 block text-sm font-medium" htmlFor="nueva">
            Contraseña nueva
          </label>
          <input
            id="nueva"
            type="password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            autoComplete="new-password"
            required
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />
          <p className={`mt-1.5 text-xs ${corta ? 'text-alerta' : 'text-tinta-suave'}`}>
            Al menos {LARGO_MINIMO} caracteres. No se piden mayúsculas ni símbolos.
          </p>

          <label className="mt-5 block text-sm font-medium" htmlFor="repetida">
            Repetila
          </label>
          <input
            id="repetida"
            type="password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            autoComplete="new-password"
            required
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />
          {noCoincide && <p className="mt-1.5 text-xs text-alerta">Las dos no coinciden.</p>}

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
            disabled={!puedeEnviar || enviando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accion px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <KeyRound size={16} aria-hidden />
            {enviando ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>

        <button
          onClick={() => {
            borrarSesion();
            window.location.href = '/';
          }}
          className="mx-auto mt-4 block text-xs text-tinta-suave underline-offset-4 hover:underline"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
