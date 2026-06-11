import type { AppRole } from '../domain/entities/app-role';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: AppRole[];
}
