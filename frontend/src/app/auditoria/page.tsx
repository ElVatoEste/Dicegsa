'use client';

import { useEffect, useState } from 'react';
import { api, ErrorApi, type Cuenta, type EventoAdmin } from '@/lib/api';
import { Conexion } from '@/components/Conexion';
import { Marco } from '@/components/Marco';
import { useEventos } from '@/lib/eventos';
import { useSesion } from '@/lib/sesion';

const ETIQUETA: Record<EventoAdmin['accion'], string> = {
  alta: 'Creó la cuenta',
  reseteo: 'Reinició la contraseña',
  cambio_rol: 'Cambió el rol',
  baja: 'Dio de baja',
  reactivacion: 'Reactivó',
};

export default function Auditoria() {
  const { sesion } = useSesion(['admin']);
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [nombres, setNombres] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const token = sesion?.token;
  const [recien, setRecien] = useState<Set<string>>(new Set());

  // Toda acción administrativa llega por la sala "cuentas", así que se recarga el
  // registro en lugar de reconstruirlo desde el evento: el servidor es la fuente.
  // El listado de cuentas se recarga junto con él porque un alta trae un id que el
  // mapa de nombres todavía no conoce, y la fila quedaría mostrando el id crudo.
  const conexion = useEventos(token, (evento) => {
    if (evento.sala !== 'cuentas' || !token) return;
    void Promise.all([api.auditoria(token), api.cuentas(token)]).then(([registro, cuentas]) => {
      setNombres(new Map(cuentas.map((c: Cuenta) => [c.id, c.nombreCuenta])));
      setEventos((previos) => {
        const conocidos = new Set(previos.map((e) => e.id));
        setRecien(new Set(registro.filter((e) => !conocidos.has(e.id)).map((e) => e.id)));
        return registro;
      });
    });
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([api.auditoria(token), api.cuentas(token)])
      .then(([registro, cuentas]) => {
        setEventos(registro);
        setNombres(new Map(cuentas.map((c: Cuenta) => [c.id, c.nombreCuenta])));
      })
      .catch((e) =>
        setError(e instanceof ErrorApi ? e.message : 'No se pudo leer el registro'),
      );
  }, [token]);

  if (!sesion) return null;

  const nombre = (id: string) => nombres.get(id) ?? id.slice(0, 8);

  return (
    <Marco
      titulo="Auditoría"
      descripcion="Toda acción de un administrador sobre una cuenta queda acá. Es la contrapartida de que pueda reiniciar la contraseña de cualquiera."
      rol={sesion.rol}
      conexion={<Conexion estado={conexion} />}
    >
      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-alerta-suave px-3 py-2.5 text-sm text-alerta">
          {error}
        </p>
      )}

      {eventos.length === 0 && !error ? (
        <p className="rounded-xl border border-linea bg-panel px-5 py-8 text-center text-sm text-tinta-suave">
          Todavía no hay acciones registradas.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-linea bg-panel">
          {eventos.map((e) => (
            <li
              key={e.id}
              className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-linea px-5 py-3.5 text-sm last:border-0 ${
                recien.has(e.id) ? 'bg-accion-suave' : ''
              }`}
            >
              <span className="font-medium">{nombre(e.actorId)}</span>
              <span className="text-tinta-suave">{ETIQUETA[e.accion].toLowerCase()}</span>
              <span className="font-medium">{nombre(e.cuentaObjetivoId)}</span>
              {e.detalle && (
                <span className="text-tinta-suave">
                  (
                  {Object.entries(e.detalle)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}
                  )
                </span>
              )}
              <time className="ml-auto font-mono text-xs text-tinta-suave" dateTime={e.creadoEn}>
                {new Date(e.creadoEn).toLocaleString('es-NI')}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Marco>
  );
}
