import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ResetRequestsController } from './reset-requests.controller';
import { ResetRequestsService } from './reset-requests.service';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController, ResetRequestsController],
  providers: [AccountsService, ResetRequestsService],
})
export class AccountsModule {}
