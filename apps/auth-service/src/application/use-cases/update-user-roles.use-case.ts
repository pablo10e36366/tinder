import { Injectable } from '@nestjs/common';

import type { UpdateUserRolesDto } from '@app/common';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class UpdateUserRolesUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute(userId: number, dto: UpdateUserRolesDto) {
    return await this.usersServiceClient.updateAccessRoles(userId, dto);
  }
}
