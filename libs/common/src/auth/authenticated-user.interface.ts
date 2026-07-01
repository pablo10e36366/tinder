import type { AppRole } from './app-role';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  roles: AppRole[];
}
