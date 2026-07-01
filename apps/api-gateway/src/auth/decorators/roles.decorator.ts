import { SetMetadata } from '@nestjs/common';

import type { AppRole } from '@app/common';
export { AUTHENTICATED_ROLES } from '@app/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
