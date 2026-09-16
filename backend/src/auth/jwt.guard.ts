import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { puedeAcceder, type RolSistema, type TokenPayload } from './acceso';
import { ROLES_REQUERIDOS } from './roles.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest();
    const encabezado: string | undefined = req.headers?.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(encabezado.slice(7));
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    if (!puedeAcceder(payload, req.url ?? '')) {
      throw new ForbiddenException('Hay que cambiar la contraseña antes de continuar');
    }

    const requeridos = this.reflector.getAllAndOverride<RolSistema[] | undefined>(
      ROLES_REQUERIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (requeridos?.length && !requeridos.includes(payload.rol)) {
      throw new ForbiddenException('Rol sin permiso para esta operación');
    }

    req.cuenta = payload;
    return true;
  }
}
