import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { TokenPayload } from '../auth/access';
import { requireText } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { optionalText } from '../orders/dto';
import { ResetRequestsService } from './reset-requests.service';

@Controller('password-reset-requests')
export class ResetRequestsController {
  constructor(private readonly requests: ResetRequestsService) {}

  /** Público: se pide desde el ingreso, sin sesión. */
  @Post()
  @HttpCode(202)
  async request(@Body() dto: { accountName: string; note?: string }) {
    await this.requests.request(requireText(dto?.accountName, 'accountName'), optionalText(dto?.note, 'note'));
    return { received: true };
  }

  @Get()
  @UseGuards(JwtGuard)
  @Roles('admin')
  list() {
    return this.requests.list();
  }

  @Post(':id/dismiss')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  @Roles('admin')
  dismiss(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.requests.dismiss(req.account.sub, id);
  }
}
