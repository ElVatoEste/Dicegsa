import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RolSistema, TokenPayload } from '../auth/acceso';
import { exigirTexto } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { CuentasService } from './cuentas.service';

@Controller('cuentas')
@UseGuards(JwtGuard)
@Roles('admin')
export class CuentasController {
  constructor(private readonly cuentas: CuentasService) {}

  @Get()
  listar() {
    return this.cuentas.listar();
  }

  @Get('auditoria')
  auditoria() {
    return this.cuentas.auditoria();
  }

  @Post()
  crear(
    @Req() req: { cuenta: TokenPayload },
    @Body() dto: { nombreCuenta: string; rol?: RolSistema },
  ) {
    return this.cuentas.crear(
      req.cuenta.sub,
      exigirTexto(dto?.nombreCuenta, 'nombreCuenta'),
      dto?.rol ?? 'operario',
    );
  }

  @Post(':id/reseteo')
  @HttpCode(200)
  resetear(@Req() req: { cuenta: TokenPayload }, @Param('id') id: string) {
    return this.cuentas.resetear(req.cuenta.sub, id);
  }

  @Patch(':id/rol')
  cambiarRol(
    @Req() req: { cuenta: TokenPayload },
    @Param('id') id: string,
    @Body() dto: { rol: RolSistema },
  ) {
    return this.cuentas.cambiarRol(req.cuenta.sub, id, exigirTexto(dto?.rol, 'rol') as RolSistema);
  }

  @Post(':id/baja')
  @HttpCode(200)
  darDeBaja(@Req() req: { cuenta: TokenPayload }, @Param('id') id: string) {
    return this.cuentas.cambiarEstado(req.cuenta.sub, id, false);
  }

  @Post(':id/reactivacion')
  @HttpCode(200)
  reactivar(@Req() req: { cuenta: TokenPayload }, @Param('id') id: string) {
    return this.cuentas.cambiarEstado(req.cuenta.sub, id, true);
  }
}
