import type { AppRole } from './app-role';

export interface UserAccess {
  id: number;
  name: string;
  email: string;
  plan: 'FREE' | 'GOLD' | 'PREMIUM';
  roles: AppRole[];
}
