import type { AppRole } from './app-role';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: AppRole[];
}
