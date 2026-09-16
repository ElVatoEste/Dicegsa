import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { generarPasswordInicial, hashear, normalizarNombreCuenta } from '../auth/passwords';
import { cuentas } from '../db/schema';

// Crea la primera cuenta administradora. Sin ella no hay forma de entrar:
// el sistema no tiene auto-registro.
const nombre = normalizarNombreCuenta(process.argv[2] ?? 'admin');
const db = drizzle(postgres(process.env.DATABASE_URL!));

const [existente] = await db
  .select({ id: cuentas.id })
  .from(cuentas)
  .where(eq(sql`lower(${cuentas.nombreCuenta})`, nombre))
  .limit(1);

if (existente) {
  console.log(`La cuenta "${nombre}" ya existe. Para rotar su contraseña, usar el reseteo del API.`);
  process.exit(0);
}

const password = generarPasswordInicial();
await db.insert(cuentas).values({
  nombreCuenta: nombre,
  hashPassword: await hashear(password),
  rol: 'admin',
  debeCambiarPassword: true,
});

console.log(`Cuenta administradora creada.\n  usuario: ${nombre}\n  contraseña: ${password}\n\nSe pide cambiarla en el primer ingreso.`);
process.exit(0);
