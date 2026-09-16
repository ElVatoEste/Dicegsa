import { SetMetadata } from '@nestjs/common';
import type { RolSistema } from './acceso';

export const ROLES_REQUERIDOS = 'roles_requeridos';

export const Roles = (...roles: RolSistema[]) => SetMetadata(ROLES_REQUERIDOS, roles);
