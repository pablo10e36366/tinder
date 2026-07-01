import type { AppRole } from './app-role';

export interface UserAuthRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roles: AppRole[];
}
