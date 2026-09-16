import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';

@Module({ imports: [DbModule, EventsModule, AuthModule, AccountsModule] })
export class AppModule {}
