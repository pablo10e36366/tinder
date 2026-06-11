import type { AppRole } from '../domain/entities/app-role';

export class UpdateUserRolesDto {
  roles!: AppRole[];
}
