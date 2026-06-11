import type { AppRole } from '../domain/entities/app-role';

export interface UserAccess {
  id: number;
  name: string;
  email: string;
  plan: 'FREE' | 'GOLD' | 'PREMIUM';
  roles: AppRole[];
}
