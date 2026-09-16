import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { generateInitialPassword, hashPassword, normalizeAccountName } from '../auth/passwords';
import { accounts } from '../db/schema';

// Crea la primera cuenta administradora. Sin ella no hay forma de entrar:
// el sistema no tiene auto-registro.
const name = normalizeAccountName(process.argv[2] ?? 'admin');
const db = drizzle(postgres(process.env.DATABASE_URL!));

const [existing] = await db
  .select({ id: accounts.id })
  .from(accounts)
  .where(eq(sql`lower(${accounts.accountName})`, name))
  .limit(1);

if (existing) {
  console.log(`La cuenta "${name}" ya existe. Para rotar su contraseña, usar el reinicio del API.`);
  process.exit(0);
}

const password = generateInitialPassword();
await db.insert(accounts).values({
  accountName: name,
  passwordHash: await hashPassword(password),
  role: 'admin',
  mustChangePassword: true,
});

console.log(
  `Cuenta administradora creada.\n  usuario: ${name}\n  contraseña: ${password}\n\nSe pide cambiarla en el primer ingreso.`,
);
process.exit(0);
