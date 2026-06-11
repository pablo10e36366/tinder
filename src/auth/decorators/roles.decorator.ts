import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '../domain/entities/app-role';
export { AUTHENTICATED_ROLES } from '../domain/entities/app-role';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
