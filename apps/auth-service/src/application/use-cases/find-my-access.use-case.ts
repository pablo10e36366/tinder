import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedUser } from '@app/common';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindMyAccessUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute(user: AuthenticatedUser) {
    const access = await this.usersServiceClient.findAccessById(user.id);

    if (!access) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return access;
  }
}
