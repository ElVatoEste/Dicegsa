import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StopCausesController } from './stop-causes.controller';
import { StopCausesService } from './stop-causes.service';

@Module({
  imports: [AuthModule],
  controllers: [StopCausesController],
  providers: [StopCausesService],
})
export class StopCausesModule {}
