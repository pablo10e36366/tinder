import type { AppRole } from '@app/common';

export interface UserAuthRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roles: AppRole[];
}
