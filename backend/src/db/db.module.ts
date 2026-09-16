import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DB = Symbol('DB');
export type Db = ReturnType<typeof crear>;
/** La transacción de Drizzle no es del mismo tipo que la conexión; los helpers aceptan ambas. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function crear() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL');
  return drizzle(postgres(url), { schema });
}

@Global()
@Module({
  providers: [{ provide: DB, useFactory: crear }],
  exports: [DB],
})
export class DbModule {}
