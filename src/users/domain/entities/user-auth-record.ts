import type { AppRole } from '../../../auth/domain/entities/app-role';

export interface UserAuthRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roles: AppRole[];
}
