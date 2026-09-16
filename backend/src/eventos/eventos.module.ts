import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventosGateway } from './eventos.gateway';

@Global()
@Module({
  imports: [AuthModule],
  providers: [EventosGateway],
  exports: [EventosGateway],
})
export class EventosModule {}
