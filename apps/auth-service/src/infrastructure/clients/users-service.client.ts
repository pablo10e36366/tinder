import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  MESSAGE_PATTERNS,
  UpdateUserRolesDto,
  type AuthenticatedUser,
  type JwtPayload,
  type UserAccess,
  type UserAuthRecord,
} from '@app/common';

@Injectable()
export class UsersServiceClient {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findAuthByEmail, { email }),
    );
  }

  async findAccessById(id: number): Promise<UserAccess | null> {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findAccessById, { id }),
    );
  }

  async findAllAccess(): Promise<UserAccess[]> {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findAllAccess, {}),
    );
  }

  async updateAccessRoles(
    userId: number,
    dto: UpdateUserRolesDto,
  ): Promise<UserAccess> {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.updateAccessRoles, {
        userId,
        dto,
      }),
    );
  }

  async validateJwtUser(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.findByEmail(payload.email);

    if (!user || user.id !== payload.sub) {
      return Promise.reject(new Error('Usuario no encontrado'));
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };
  }
}
