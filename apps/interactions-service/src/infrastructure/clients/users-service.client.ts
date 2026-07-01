import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MESSAGE_PATTERNS, type PublicUser } from '@app/common';

@Injectable()
export class UsersServiceClient {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  async findPublicById(userId: number): Promise<PublicUser> {
    const user = await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findPublicById, { id: userId }),
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
