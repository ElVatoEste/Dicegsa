import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { TokenPayload } from './acceso';
import { AuthService } from './auth.service';
import { exigirTexto, type CambioPasswordDto, type LoginDto } from './dto';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(
      exigirTexto(dto?.nombreCuenta, 'nombreCuenta'),
      exigirTexto(dto?.password, 'password'),
    );
  }

  @Post('password')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  cambiarPassword(@Req() req: { cuenta: TokenPayload }, @Body() dto: CambioPasswordDto) {
    return this.auth.cambiarPassword(
      req.cuenta.sub,
      exigirTexto(dto?.passwordActual, 'passwordActual'),
      exigirTexto(dto?.passwordNueva, 'passwordNueva'),
    );
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@Req() req: { cuenta: TokenPayload }) {
    return req.cuenta;
  }
}
