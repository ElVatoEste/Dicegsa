import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { cuentas } from '../db/schema';
import type { TokenPayload } from './acceso';
import {
  hashear,
  normalizarNombreCuenta,
  passwordAceptable,
  LARGO_MINIMO,
  verificar,
} from './passwords';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService,
  ) {}

  async login(nombreCuenta: string, password: string) {
    const [cuenta] = await this.db
      .select()
      .from(cuentas)
      .where(eq(sql`lower(${cuentas.nombreCuenta})`, normalizarNombreCuenta(nombreCuenta)))
      .limit(1);

    // Mismo mensaje para cuenta inexistente y contraseña equivocada: distinguirlos
    // permitiría enumerar qué nombres de cuenta existen.
    const invalidas = new UnauthorizedException('Credenciales inválidas');
    if (!cuenta) {
      await verificar(password, HASH_SEÑUELO).catch(() => false);
      throw invalidas;
    }
    if (!(await verificar(password, cuenta.hashPassword))) throw invalidas;
    if (!cuenta.activa) throw new UnauthorizedException('Cuenta desactivada');

    const payload: TokenPayload = {
      sub: cuenta.id,
      nombreCuenta: cuenta.nombreCuenta,
      rol: cuenta.rol,
      debeCambiarPassword: cuenta.debeCambiarPassword,
    };
    return {
      token: await this.jwt.signAsync(payload),
      debeCambiarPassword: cuenta.debeCambiarPassword,
      rol: cuenta.rol,
    };
  }

  async cambiarPassword(cuentaId: string, passwordActual: string, passwordNueva: string) {
    const [cuenta] = await this.db.select().from(cuentas).where(eq(cuentas.id, cuentaId)).limit(1);
    if (!cuenta) throw new UnauthorizedException('Credenciales inválidas');
    if (!(await verificar(passwordActual, cuenta.hashPassword))) {
      throw new UnauthorizedException('La contraseña actual no coincide');
    }
    if (!passwordAceptable(passwordNueva)) {
      throw new BadRequestException(`La contraseña nueva necesita al menos ${LARGO_MINIMO} caracteres`);
    }
    if (await verificar(passwordNueva, cuenta.hashPassword)) {
      throw new BadRequestException('La contraseña nueva tiene que ser distinta de la actual');
    }

    await this.db
      .update(cuentas)
      .set({
        hashPassword: await hashear(passwordNueva),
        debeCambiarPassword: false,
        actualizadaEn: new Date(),
      })
      .where(eq(cuentas.id, cuentaId));

    const payload: TokenPayload = {
      sub: cuenta.id,
      nombreCuenta: cuenta.nombreCuenta,
      rol: cuenta.rol,
      debeCambiarPassword: false,
    };
    return { token: await this.jwt.signAsync(payload) };
  }
}

/**
 * Hash descartable contra el que se verifica cuando la cuenta no existe, para que
 * el login tarde lo mismo exista o no y no se pueda enumerar por tiempo de respuesta.
 */
const HASH_SEÑUELO =
  '$argon2id$v=19$m=65536,t=2,p=1$c2VudGluZWxhc2VudGluZWxh$Q2FyZ2FEZXNjYXJ0YWJsZVBhcmFUaW1pbmc';
