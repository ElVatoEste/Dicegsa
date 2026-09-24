import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { canAccess, type SystemRole, type TokenPayload } from './access';
import { REQUIRED_ROLES } from './roles.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    if (!canAccess(payload, req.url ?? '')) {
      throw new ForbiddenException('Hay que cambiar la contraseña antes de continuar');
    }

    const required = this.reflector.getAllAndOverride<SystemRole[] | undefined>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length && !required.includes(payload.role)) {
      throw new ForbiddenException('Rol sin permiso para esta operación');
    }

    req.account = payload;
    return true;
  }
}
