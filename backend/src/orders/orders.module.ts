import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersController, PickListsController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PickListsService } from './pick-lists.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, PickListsController],
  providers: [OrdersService, PickListsService],
})
export class OrdersModule {}
