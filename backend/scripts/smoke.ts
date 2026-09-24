// Prueba de humo del flujo del PKL contra el API en marcha. Crea cuentas smoke_* y al
// terminar borra lo que creó, salga bien o mal.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { accounts, workers } from '../src/db/schema';
import { hashPassword } from '../src/auth/passwords';

const API = 'http://localhost:7300';
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);
const PASS = 'smoke-pass-1';
const hash = await hashPassword(PASS);

const tag = Date.now().toString(36);
const make = async (name: string, role: any, fullName?: string) => {
  const [a] = await db
    .insert(accounts)
    .values({ accountName: `smoke_${name}_${tag}`, passwordHash: hash, role, mustChangePassword: false })
    .returning();
  if (fullName) await db.insert(workers).values({ accountId: a!.id, fullName });
  return a!;
};
const desk = await make('desk', 'control_desk');
const picker = await make('picker', 'operator', `Alistador ${tag}`);
const validator = await make('validator', 'validator', `Validador ${tag}`);

/** Borra las cuentas de esta corrida y todo lo que cargaron, en una transacción. */
async function cleanup() {
  await client.begin(async (sql) => {
    const d = sql`select id from accounts where account_name like ${`smoke\\_%\\_${tag}`}`;
    const o = sql`select id from orders where created_by in (${d})`;
    const p = sql`select id from pick_lists where created_by in (${d})`;
    await sql`delete from validation_errors where pick_list_id in (${p})`;
    await sql`delete from stops where pick_list_id in (${p})`;
    await sql`delete from pick_events where pick_list_id in (${p})`;
    await sql`delete from assignments where pick_list_id in (${p})`;
    await sql`update orders set pick_list_id = null where pick_list_id in (${p})`;
    await sql`delete from pick_lists where id in (${p})`;
    await sql`delete from order_lines where order_id in (${o})`;
    await sql`delete from orders where id in (${o})`;
    await sql`delete from audit_log where actor_id in (${d})`;
    await sql`delete from workers where account_id in (${d})`;
    await sql`delete from accounts where id in (${d})`;
  });
}

try {

  async function call(token: string | null, method: string, path: string, body?: unknown) {
    const res = await fetch(API + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
    return data;
  }
  const login = async (a: { accountName: string }) =>
    (await call(null, 'POST', '/auth/login', { accountName: a.accountName, password: PASS })).token;

  const [tDesk, tPicker, tVal] = await Promise.all([login(desk), login(picker), login(validator)]);

  const zones = await call(tDesk, 'GET', '/catalogs/dispatch_zone');
  const errTypes = await call(tDesk, 'GET', '/catalogs/error_type');
  console.log('zonas', zones.length, 'tipos de error', errTypes.length);

  const order = await call(tDesk, 'POST', '/orders', {
    externalId: `P-${tag}`,
    receivedAt: new Date().toISOString(),
    clientCode: 'C1',
    clientName: 'Farmacia Smoke',
    department: 'Managua',
    municipality: 'Managua',
    dueAt: new Date(Date.now() + 3600e3).toISOString(),
    dispatchZoneId: zones[0].id,
    lines: [
      { productCode: 'A1', productName: 'Jabón íntimo', quantity: 5, lot: 'L1', expiresOn: '2027-01-31' },
      { productCode: 'A2', productName: 'Jabón de cuerpo', quantity: 4, lot: 'L2' },
    ],
  });
  const listed = (await call(tDesk, 'GET', '/orders')).find((o: any) => o.id === order.id);
  console.log('pedido', listed.status, listed.lineCount, 'líneas', listed.units, 'unidades');

  await call(tDesk, 'PATCH', `/orders/${order.id}`, { dueAt: new Date(Date.now() + 1800e3).toISOString() });

  const pkl = await call(tDesk, 'POST', '/pick-lists', { orderIds: [order.id], assigneeId: picker.id });
  console.log('PKL', pkl.number);

  let mine = await call(tPicker, 'GET', '/pick-lists/mine');
  const mineP = mine.find((p: any) => p.id === pkl.id);
  const [l1, l2] = mineP.orders[0].lines;

  const causes = await call(tPicker, 'GET', '/stop-causes');
  if (causes[0]) {
    await call(tPicker, 'POST', `/pick-lists/${pkl.id}/stops`, { causeId: causes[0].id });
    await call(tPicker, 'POST', `/pick-lists/${pkl.id}/stops/end`);
  }
  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/lines/${l1.id}`, { status: 'picked' });
  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/lines/${l2.id}`, { status: 'not_found' });

  // Una línea no encontrada frena la entrega.
  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/deliver`).then(
    () => console.log('ERROR: dejó entregar con línea no encontrada'),
    () => console.log('entrega frenada por línea no encontrada: ok'),
  );
  await call(tDesk, 'POST', `/orders/lines/${l2.id}/cancel`);
  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/deliver`);

  // El validador no puede marcar líneas; otro operario tampoco.
  await call(tVal, 'POST', `/pick-lists/${pkl.id}/lines/${l1.id}`, { status: 'picked' }).then(
    () => console.log('ERROR: el validador marcó una línea'),
    () => console.log('validador no marca líneas: ok'),
  );

  const queue = await call(tVal, 'GET', '/pick-lists/validation-queue');
  console.log('en cola de validación', queue.some((p: any) => p.id === pkl.id));
  await call(tVal, 'POST', `/pick-lists/${pkl.id}/validate`, {
    errors: [{ lineId: l1.id, errorTypeId: errTypes[0].id, units: 1 }],
  });
  mine = await call(tPicker, 'GET', '/pick-lists/mine');
  console.log('devuelto al alistador', mine.find((p: any) => p.id === pkl.id)?.status);

  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/lines/${l1.id}`, { status: 'picked' });
  await call(tPicker, 'POST', `/pick-lists/${pkl.id}/deliver`);
  await call(tVal, 'POST', `/pick-lists/${pkl.id}/validate`, { errors: [] });
  const final = (await call(tDesk, 'GET', '/orders')).find((o: any) => o.id === order.id);
  console.log('estado final del pedido', final.status, final.units, 'unidades vigentes');

} finally {
  await cleanup();
  console.log('cuentas y datos de prueba borrados');
}

process.exit(0);
