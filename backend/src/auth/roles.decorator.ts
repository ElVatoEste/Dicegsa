import { SetMetadata } from '@nestjs/common';
import type { SystemRole } from './access';

export const REQUIRED_ROLES = 'required_roles';

export const Roles = (...roles: SystemRole[]) => SetMetadata(REQUIRED_ROLES, roles);
