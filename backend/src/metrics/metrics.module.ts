import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [AuthModule, CatalogsModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
