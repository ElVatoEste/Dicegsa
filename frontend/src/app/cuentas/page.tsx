'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Power, UserPlus } from 'lucide-react';
import { api, ErrorApi, type Cuenta, type RolSistema } from '@/lib/api';
import { Conexion } from '@/components/Conexion';
import { Marco } from '@/components/Marco';
import { useEventos } from '@/lib/eventos';
import { useSesion } from '@/lib/sesion';

const ROLES: RolSistema[] = ['operario', 'supervisor', 'gerencia', 'admin'];

export default function Cuentas() {
  const { sesion } = useSesion(['admin']);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [entrega, setEntrega] = useState<{ nombreCuenta: string; password: string } | null>(null);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState<RolSistema>('operario');
  const [ocupado, setOcupado] = useState(false);

  const token = sesion?.token;

  const recargar = useCallback(async () => {
    if (!token) return;
    try {
      setCuentas(await api.cuentas(token));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo leer el listado');
    }
  }, [token]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // El listado se refresca cuando otro administrador toca una cuenta, sin recargar
  // la página.
  const conexion = useEventos(token, (evento) => {
    if (evento.sala === 'cuentas') void recargar();
  });

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    setOcupado(true);
    try {
      await accion();
      await recargar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo completar la operación');
    } finally {
      setOcupado(false);
    }
  }

  if (!sesion) return null;

  return (
    <Marco
      titulo="Cuentas"
      descripcion="Las cuentas las crea y reinicia un administrador. No hay auto-registro ni recuperación por correo."
      rol={sesion.rol}
      conexion={<Conexion estado={conexion} />}
    >
      {entrega && (
        <div className="mb-8 rounded-xl border border-aviso/30 bg-aviso-suave p-5">
          <p className="text-sm font-medium text-aviso">
            Entregá esta contraseña a {entrega.nombreCuenta}
          </p>
          <p className="mt-3 font-mono text-2xl tracking-wider text-tinta">{entrega.password}</p>
          <p className="mt-3 text-xs text-aviso">
            Se muestra una sola vez y sirve una sola vez: al ingresar se le pide cambiarla. Si se
            pierde, hay que reiniciarla de nuevo.
          </p>
          <button
            onClick={() => setEntrega(null)}
            className="mt-4 rounded-lg border border-aviso/30 bg-panel px-3 text-sm font-medium text-aviso"
          >
            Ya la entregué
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!token || !nombreNuevo.trim()) return;
          void ejecutar(async () => {
            const { cuenta, passwordInicial } = await api.crearCuenta(token, nombreNuevo, rolNuevo);
            setEntrega({ nombreCuenta: cuenta.nombreCuenta, password: passwordInicial });
            setNombreNuevo('');
            setRolNuevo('operario');
          });
        }}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-linea bg-panel p-5"
      >
        <div className="grow basis-56">
          <label className="block text-sm font-medium" htmlFor="nuevo">
            Nombre de cuenta
          </label>
          <input
            id="nuevo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="jlopez"
            autoCapitalize="none"
            spellCheck={false}
            className="mt-1.5 w-full rounded-lg border border-linea px-3 text-base outline-none focus:border-accion"
          />
        </div>
        <div className="basis-44">
          <label className="block text-sm font-medium" htmlFor="rolNuevo">
            Rol
          </label>
          <select
            id="rolNuevo"
            value={rolNuevo}
            onChange={(e) => setRolNuevo(e.target.value as RolSistema)}
            className="mt-1.5 w-full rounded-lg border border-linea bg-panel px-3 text-base outline-none focus:border-accion"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={ocupado || !nombreNuevo.trim()}
          className="flex items-center gap-2 rounded-lg bg-accion px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus size={16} aria-hidden />
          Crear
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-alerta-suave px-3 py-2.5 text-sm text-alerta">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-linea bg-panel">
        <table className="w-full min-w-2xl text-sm">
          <thead className="border-b border-linea text-left text-xs uppercase tracking-wide text-tinta-suave">
            <tr>
              <th className="px-5 py-3 font-medium">Cuenta</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} className="border-b border-linea last:border-0">
                <td className="px-5 py-3.5">
                  <span className="font-medium">{c.nombreCuenta}</span>
                  {c.debeCambiarPassword && (
                    <span className="ml-2 rounded-full bg-aviso-suave px-2 py-0.5 text-xs text-aviso">
                      contraseña sin cambiar
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <select
                    value={c.rol}
                    disabled={ocupado}
                    onChange={(e) =>
                      token &&
                      void ejecutar(() =>
                        api.cambiarRol(token, c.id, e.target.value as RolSistema),
                      )
                    }
                    className="rounded-lg border border-linea bg-panel px-2 text-sm outline-none focus:border-accion"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3.5">
                  <span className={c.activa ? 'text-accion' : 'text-tinta-suave'}>
                    {c.activa ? 'Activa' : 'Dada de baja'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={ocupado}
                      onClick={() =>
                        token &&
                        void ejecutar(async () => {
                          const { cuenta, passwordInicial } = await api.resetear(token, c.id);
                          setEntrega({
                            nombreCuenta: cuenta.nombreCuenta,
                            password: passwordInicial,
                          });
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-linea px-3 text-sm transition-colors hover:bg-fondo disabled:opacity-50"
                    >
                      <KeyRound size={14} aria-hidden />
                      Reiniciar
                    </button>
                    <button
                      disabled={ocupado}
                      onClick={() =>
                        token && void ejecutar(() => api.cambiarEstado(token, c.id, !c.activa))
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-linea px-3 text-sm transition-colors hover:bg-fondo disabled:opacity-50"
                    >
                      <Power size={14} aria-hidden />
                      {c.activa ? 'Dar de baja' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-tinta-suave">
        Las cuentas se dan de baja, nunca se borran: sus eventos de alisto tienen que seguir siendo
        trazables.
      </p>
    </Marco>
  );
}
