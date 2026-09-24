// Datos de demostración: cuentas demo_* con la contraseña DEMO_PASSWORD, causas de
// parada y pedidos con entregas escalonadas. Se puede correr más de una vez.
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from '../src/auth/passwords';
import { accounts, catalogEntries, orderLines, orders, stopCauses, workers } from '../src/db/schema';

const PASSWORD = process.env.DEMO_PASSWORD ?? 'demo1234';
const db = drizzle(postgres(process.env.DATABASE_URL!));
const hash = await hashPassword(PASSWORD);

async function account(accountName: string, role: any, fullName?: string) {
  const [existing] = await db.select().from(accounts).where(eq(accounts.accountName, accountName)).limit(1);
  const row =
    existing ??
    (await db
      .insert(accounts)
      .values({ accountName, passwordHash: hash, role, mustChangePassword: false })
      .returning())[0]!;
  if (fullName) await db.insert(workers).values({ accountId: row.id, fullName }).onConflictDoNothing();
  return row;
}

const desk = await account('demo_mesa', 'control_desk');
await account('demo_supervisor', 'supervisor');
await account('demo_admin', 'admin');
await account('demo_gerencia', 'management');
await account('demo_validador', 'validator', 'Karla Méndez');
for (const [name, full] of [
  ['demo_alistador', 'Jean Carlos Palacios'],
  ['demo_alistador2', 'Kevin Romero'],
  ['demo_alistador3', 'Elías Ríos'],
] as const) {
  await account(name, 'operator', full);
}

for (const [name, attributable] of [
  ['Espera de inventario', false],
  ['Caída del ERP', false],
  ['Espera de firma de regencia', false],
  ['Equipo sin carga', false],
  ['Descanso no programado', true],
] as const) {
  await db.insert(stopCauses).values({ name, attributable, createdBy: desk.id }).onConflictDoNothing();
}

const zones = await db.select().from(catalogEntries);
const zone = (name: string) => zones.find((z) => z.name === name)!.id;

const clients = [
  ['C-1042', 'Farmacia San Martín', 'Managua', 'Managua', 'Managua', 'Picking'],
  ['C-2210', 'Hospital Escuela Oscar Danilo Rosales', 'León', 'León', 'Occidente', 'Medicamentos instituciones y controlados'],
  ['C-3317', 'Farmacia Kielsa Masaya', 'Masaya', 'Masaya', 'Sur oriente', 'Cuarto frío y climatizado'],
  ['C-0981', 'Clínica Santa Fe', 'Managua', 'Tipitapa', 'Managua', 'Dispositivos médicos'],
  ['C-4408', 'Farmacia Saba Granada', 'Granada', 'Granada', 'Sur oriente', 'Picking'],
  ['C-5120', 'Distribuidora Rivas', 'Rivas', 'Rivas', 'Correo', 'Picking'],
  ['C-1777', 'Farmacia Medco Chinandega', 'Chinandega', 'Chinandega', 'Occidente', 'Cuarto frío y climatizado'],
] as const;
const products = [
  ['P-1001', 'Jabón íntimo 250 ml'],
  ['P-1002', 'Jabón de cuerpo 400 ml'],
  ['P-2040', 'Amoxicilina 500 mg x 21'],
  ['P-3310', 'Guantes de nitrilo talla M'],
  ['P-4102', 'Insulina glargina 100 UI'],
  ['P-5500', 'Suero oral sabor fresa'],
  ['P-6021', 'Jeringa 5 ml con aguja'],
] as const;
// Minutos hasta la entrega: dos vencen pronto, uno ya venció, el resto con margen.
const dueInMinutes = [25, 70, -15, 240, 600, 1440, 2880];

const { count } = (await db.select({ count: sql<number>`count(*)::int` }).from(orders))[0]!;
if (count < clients.length) {
  for (const [i, [code, name, dept, muni, dispatch, inventory]] of clients.entries()) {
    const [order] = await db
      .insert(orders)
      .values({
        externalId: `PED-${48210 + i}`,
        receivedAt: new Date(Date.now() - (i + 1) * 17 * 60000),
        clientCode: code,
        clientName: name,
        department: dept,
        municipality: muni,
        notes: i === 1 ? 'Entregar por portón de farmacia interna' : null,
        dueAt: new Date(Date.now() + dueInMinutes[i]! * 60000),
        dispatchZoneId: zone(dispatch),
        inventoryZoneId: zone(inventory),
        createdBy: desk.id,
      })
      .returning();
    const lines = products.slice(i % 3, (i % 3) + 2 + (i % 3));
    await db.insert(orderLines).values(
      lines.map(([productCode, productName], j) => ({
        orderId: order!.id,
        productCode,
        productName,
        quantity: 3 + ((i + j) * 7) % 20,
        lot: `L${2600 + i * 10 + j}`,
        expiresOn: `2027-0${1 + ((i + j) % 9)}-15`,
      })),
    );
  }
}

console.log(`Listo. Cuentas demo_* con contraseña "${PASSWORD}".`);
process.exit(0);
