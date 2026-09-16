import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { DbModule } from './db/db.module';
import { EventosModule } from './eventos/eventos.module';

@Module({ imports: [DbModule, EventosModule, AuthModule, CuentasModule] })
export class AppModule {}
