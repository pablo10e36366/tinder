import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedUser, JwtPayload } from '@app/common';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class ValidateJwtUserUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersServiceClient.findByEmail(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };
  }
}
