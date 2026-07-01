import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MESSAGE_PATTERNS } from '@app/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Public()
  @Get()
  getStatus() {
    return {
      name: 'tinder-api-gateway',
      status: 'ok',
      transport: 'tcp',
    };
  }

  @Public()
  @Get('users/ping')
  async pingUsersService() {
    return firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.ping, {
        source: 'api-gateway',
      }),
    );
  }
}
