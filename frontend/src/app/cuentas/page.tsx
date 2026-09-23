'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, KeyRound, Power, UserPlus, Users } from 'lucide-react';
import { accountsApi, ApiError, type Account, type FloorRole, type SystemRole } from '@/lib/api';
import { useAuthGuard } from '@/components/AuthGuard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Shell } from '@/components/Shell';
import { useToast } from '@/components/Toasts';
import { Badge, Button, EmptyState, Field, Input, Select, Table, Td, Th } from '@/components/ui';
import { FLOOR_ROLE_LABEL, FLOOR_ROLES, ROLE_LABEL, ROLES } from '@/lib/labels';
import { useRealtime } from '@/lib/events';

interface Handover {
  accountName: string;
  password: string;
}

export default function AccountsPage() {
  const session = useAuthGuard(['admin']);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<SystemRole>('operator');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const token = session?.token;

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setAccounts(await accountsApi.list(token));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo leer el listado');
    }
    // toast viene de un contexto estable; incluirlo rearmaría el efecto en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // El listado se refresca cuando otro administrador toca una cuenta, sin recargar
  // la página.
  const connection = useRealtime(token, (event) => {
    if (event.room === 'accounts') void reload();
  });

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo completar la operación');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <Shell
      title="Cuentas"
      subtitle="Las cuentas las crea y reinicia un administrador. No hay auto-registro ni recuperación por correo."
      role={session.role}
      accountName={session.accountName}
      status={<ConnectionStatus state={connection} />}
    >
      {handover && (
        // El único momento en que algo del sistema pasa de una persona a otra en
        // mano, así que se lee de lejos y no se confunde con un aviso más.
        <div className="mb-8 overflow-hidden rounded-xl bg-indigo-800">
          <div className="flex flex-wrap items-center justify-between gap-6 px-6 py-5">
            <div>
              <p className="text-sm text-white/60">Contraseña para {handover.accountName}</p>
              <p className="cifras mt-2 text-4xl font-semibold tracking-[0.14em] text-white">
                {handover.password}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setHandover(null)}>
              Ya la entregué
            </Button>
          </div>
          <p className="border-t border-white/10 px-6 py-3 text-xs text-white/55">
            Se muestra una sola vez y sirve una sola vez: al ingresar se le pide cambiarla. Si se
            pierde, hay que reiniciarla de nuevo.
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!token || !newName.trim()) return;
          void run(async () => {
            const created = await accountsApi.create(token, newName, newRole);
            setHandover({
              accountName: created.account.accountName,
              password: created.initialPassword,
            });
            toast.success(`Cuenta ${created.account.accountName} creada`);
            setNewName('');
            setNewRole('operator');
          });
        }}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-5"
      >
        <Field label="Nombre de cuenta" htmlFor="newName" className="grow basis-56">
          <Input
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="jlopez"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>
        <Field label="Rol" htmlFor="newRole" className="basis-44">
          <Select
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as SystemRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={!newName.trim()} loading={busy}>
          <UserPlus size={16} aria-hidden />
          Crear cuenta
        </Button>
      </form>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay cuentas"
          description="Creá la primera con el formulario de arriba y entregá la contraseña en mano."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Cuenta</Th>
              <Th>Rol</Th>
              <Th>Colaborador</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <Td>
                  <span className="font-medium">{account.accountName}</span>
                  {account.mustChangePassword && (
                    <Badge tone="warning" className="ml-2">
                      contraseña sin cambiar
                    </Badge>
                  )}
                </Td>
                <Td>
                  <Select
                    value={account.role}
                    size="sm"
                    disabled={busy}
                    className="w-44"
                    onChange={(e) => {
                      if (!token) return;
                      const role = e.target.value as SystemRole;
                      void run(async () => {
                        await accountsApi.changeRole(token, account.id, role);
                        toast.success(
                          `${account.accountName} ahora es ${ROLE_LABEL[role].toLowerCase()}`,
                        );
                      });
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  {account.role === 'operator' ? (
                    <WorkerForm
                      account={account}
                      busy={busy}
                      onSave={(fullName, floorRole) => {
                        if (!token) return;
                        void run(async () => {
                          await accountsApi.saveWorker(token, account.id, fullName, floorRole);
                          toast.success(`Perfil de ${account.accountName} guardado`);
                        });
                      }}
                    />
                  ) : (
                    <span className="text-sm text-muted">No trabaja en el piso</span>
                  )}
                </Td>
                <Td>
                  {account.active ? (
                    <Badge tone="success">Activa</Badge>
                  ) : (
                    <Badge tone="neutral">Dada de baja</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (!token) return;
                        void run(async () => {
                          const reset = await accountsApi.resetPassword(token, account.id);
                          setHandover({
                            accountName: reset.account.accountName,
                            password: reset.initialPassword,
                          });
                          toast.warning(
                            `Entregale la contraseña nueva a ${reset.account.accountName}`,
                          );
                        });
                      }}
                    >
                      <KeyRound size={14} aria-hidden />
                      Reiniciar
                    </Button>
                    <Button
                      variant={account.active ? 'danger' : 'secondary'}
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (!token) return;
                        void run(async () => {
                          await accountsApi.setActive(token, account.id, !account.active);
                          toast.success(
                            account.active
                              ? `${account.accountName} quedó dada de baja`
                              : `${account.accountName} vuelve a estar activa`,
                          );
                        });
                      }}
                    >
                      <Power size={14} aria-hidden />
                      {account.active ? 'Dar de baja' : 'Reactivar'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-4 text-xs text-muted">
        Las cuentas se dan de baja, nunca se borran: sus eventos de alisto tienen que seguir siendo
        trazables.
      </p>
    </Shell>
  );
}

/**
 * Nombre y rol en el piso de una cuenta de operario. El OLE se calcula sobre este
 * perfil, así que una cuenta sin él no aparece en la medición.
 */
function WorkerForm({
  account,
  busy,
  onSave,
}: {
  account: Account;
  busy: boolean;
  onSave: (fullName: string, floorRole: FloorRole) => void;
}) {
  const [fullName, setFullName] = useState(account.fullName ?? '');
  const [floorRole, setFloorRole] = useState<FloorRole>(account.floorRole ?? 'picker');

  const dirty =
    fullName.trim() !== (account.fullName ?? '') || floorRole !== (account.floorRole ?? 'picker');

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (fullName.trim()) onSave(fullName, floorRole);
      }}
    >
      <Input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Nombre completo"
        aria-label={`Nombre completo de ${account.accountName}`}
        size="sm"
        className="w-44"
      />
      <Select
        value={floorRole}
        size="sm"
        className="w-32"
        aria-label={`Rol en el piso de ${account.accountName}`}
        onChange={(e) => setFloorRole(e.target.value as FloorRole)}
      >
        {FLOOR_ROLES.map((r) => (
          <option key={r} value={r}>
            {FLOOR_ROLE_LABEL[r]}
          </option>
        ))}
      </Select>
      {/* Reserva su lugar aunque no haya cambios, así la fila no se reacomoda al tipear. */}
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={busy || !dirty || !fullName.trim()}
        aria-label="Guardar perfil"
        className={dirty ? '' : 'invisible'}
      >
        <Check size={14} aria-hidden />
      </Button>
    </form>
  );
}
