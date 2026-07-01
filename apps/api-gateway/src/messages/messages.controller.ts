import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  CreateMessageDto,
  MESSAGE_PATTERNS,
  type AuthenticatedUser,
} from '@app/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';

@Controller('messages')
export class MessagesController {
  constructor(
    @Inject('MESSAGES_SERVICE') private readonly messagesClient: ClientProxy,
  ) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return await firstValueFrom(
      this.messagesClient.send(MESSAGE_PATTERNS.messages.send, {
        senderId: user.id,
        dto: createMessageDto,
      }),
    );
  }

  @Get(':matchId')
  @Roles(...AUTHENTICATED_ROLES)
  async findByMatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return await firstValueFrom(
      this.messagesClient.send(MESSAGE_PATTERNS.messages.findByMatch, {
        userId: user.id,
        matchId,
      }),
    );
  }
}
