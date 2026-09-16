import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { DbModule } from './db/db.module';

@Module({ imports: [DbModule, AuthModule, CuentasModule] })
export class AppModule {}
