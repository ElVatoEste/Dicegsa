import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { accounts } from '../db/schema';
import type { TokenPayload } from './access';
import {
  hashPassword,
  isPasswordAcceptable,
  MIN_LENGTH,
  normalizeAccountName,
  verifyPassword,
} from './passwords';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService,
  ) {}

  async login(accountName: string, password: string) {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(sql`lower(${accounts.accountName})`, normalizeAccountName(accountName)))
      .limit(1);

    // Mismo mensaje para cuenta inexistente y contraseña equivocada: distinguirlos
    // permitiría enumerar qué nombres de cuenta existen.
    const invalid = new UnauthorizedException('Credenciales inválidas');
    if (!account) {
      await verifyPassword(password, DECOY_HASH).catch(() => false);
      throw invalid;
    }
    if (!(await verifyPassword(password, account.passwordHash))) throw invalid;
    if (!account.active) throw new UnauthorizedException('Cuenta desactivada');

    const payload: TokenPayload = {
      sub: account.id,
      accountName: account.accountName,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
    };
    return {
      token: await this.jwt.signAsync(payload),
      accountName: account.accountName,
      mustChangePassword: account.mustChangePassword,
      role: account.role,
    };
  }

  async changePassword(accountId: string, currentPassword: string, newPassword: string) {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);
    if (!account) throw new UnauthorizedException('Credenciales inválidas');
    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual no coincide');
    }
    if (!isPasswordAcceptable(newPassword)) {
      throw new BadRequestException(
        `La contraseña nueva necesita al menos ${MIN_LENGTH} caracteres`,
      );
    }
    if (await verifyPassword(newPassword, account.passwordHash)) {
      throw new BadRequestException('La contraseña nueva tiene que ser distinta de la actual');
    }

    await this.db
      .update(accounts)
      .set({
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));

    const payload: TokenPayload = {
      sub: account.id,
      accountName: account.accountName,
      role: account.role,
      mustChangePassword: false,
    };
    return { token: await this.jwt.signAsync(payload) };
  }
}

/**
 * Hash descartable contra el que se verifica cuando la cuenta no existe, para que
 * el login tarde lo mismo exista o no y no se pueda enumerar por tiempo de respuesta.
 */
const DECOY_HASH =
  '$argon2id$v=19$m=65536,t=2,p=1$c2VudGluZWxhc2VudGluZWxh$Q2FyZ2FEZXNjYXJ0YWJsZVBhcmFUaW1pbmc';
