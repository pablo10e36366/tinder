import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MESSAGE_PATTERNS, type AuthenticatedUser } from '@app/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';

@Controller('matches')
export class MatchesController {
  constructor(
    @Inject('MATCHES_SERVICE') private readonly matchesClient: ClientProxy,
  ) {}

  @Get()
  @Roles(...AUTHENTICATED_ROLES)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return await firstValueFrom(
      this.matchesClient.send(MESSAGE_PATTERNS.matches.findMine, {
        userId: user.id,
      }),
    );
  }
}
