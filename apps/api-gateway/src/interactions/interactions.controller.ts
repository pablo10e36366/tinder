import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  CreateInteractionDto,
  MESSAGE_PATTERNS,
  type AuthenticatedUser,
} from '@app/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';

@Controller('interactions')
export class InteractionsController {
  constructor(
    @Inject('INTERACTIONS_SERVICE')
    private readonly interactionsClient: ClientProxy,
  ) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  async createOrUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createInteractionDto: CreateInteractionDto,
  ) {
    return await firstValueFrom(
      this.interactionsClient.send(MESSAGE_PATTERNS.interactions.createOrUpdate, {
        userId: user.id,
        dto: createInteractionDto,
      }),
    );
  }

  @Get('sent')
  @Roles(...AUTHENTICATED_ROLES)
  async findSent(@CurrentUser() user: AuthenticatedUser) {
    return await firstValueFrom(
      this.interactionsClient.send(MESSAGE_PATTERNS.interactions.findSent, {
        userId: user.id,
      }),
    );
  }
}
