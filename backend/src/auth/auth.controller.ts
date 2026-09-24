import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { TokenPayload } from './access';
import { AuthService } from './auth.service';
import { requireText, type ChangePasswordDto, type LoginDto } from './dto';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(
      requireText(dto?.accountName, 'accountName'),
      requireText(dto?.password, 'password'),
    );
  }

  @Post('password')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  changePassword(@Req() req: { account: TokenPayload }, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(
      req.account.sub,
      requireText(dto?.currentPassword, 'currentPassword'),
      requireText(dto?.newPassword, 'newPassword'),
    );
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@Req() req: { account: TokenPayload }) {
    return req.account;
  }
}
