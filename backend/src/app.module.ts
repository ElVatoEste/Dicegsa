import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { OrdersModule } from './orders/orders.module';
import { StopCausesModule } from './stop-causes/stop-causes.module';

@Module({
  imports: [
    DbModule,
    EventsModule,
    AuthModule,
    AccountsModule,
    StopCausesModule,
    CatalogsModule,
    OrdersModule,
    MetricsModule,
  ],
})
export class AppModule {}
