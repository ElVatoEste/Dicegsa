import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SystemRole, TokenPayload } from '../auth/access';
import { requireText } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { floorRole } from '../db/schema';
import { AccountsService, type FloorRole } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtGuard)
@Roles('admin')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list() {
    return this.accounts.list();
  }

  @Get('audit-log')
  auditLog() {
    return this.accounts.auditLog();
  }

  @Post()
  create(
    @Req() req: { account: TokenPayload },
    @Body() dto: { accountName: string; role?: SystemRole },
  ) {
    return this.accounts.create(
      req.account.sub,
      requireText(dto?.accountName, 'accountName'),
      dto?.role ?? 'operator',
    );
  }

  @Post(':id/password-reset')
  @HttpCode(200)
  resetPassword(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.accounts.resetPassword(req.account.sub, id);
  }

  @Patch(':id/role')
  changeRole(
    @Req() req: { account: TokenPayload },
    @Param('id') id: string,
    @Body() dto: { role: SystemRole },
  ) {
    return this.accounts.changeRole(req.account.sub, id, requireText(dto?.role, 'role') as SystemRole);
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  deactivate(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.accounts.setActive(req.account.sub, id, false);
  }

  @Post(':id/reactivate')
  @HttpCode(200)
  reactivate(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.accounts.setActive(req.account.sub, id, true);
  }

  @Put(':id/worker')
  upsertWorker(
    @Req() req: { account: TokenPayload },
    @Param('id') id: string,
    @Body() dto: { fullName: string; floorRole: FloorRole },
  ) {
    if (!floorRole.enumValues.includes(dto?.floorRole)) {
      throw new BadRequestException('El campo floorRole no es un rol en el piso válido');
    }
    return this.accounts.upsertWorker(
      req.account.sub,
      id,
      requireText(dto.fullName, 'fullName'),
      dto.floorRole,
    );
  }
}
