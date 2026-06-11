import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FindMatchMessagesUseCase } from './application/use-cases/find-match-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly findMatchMessagesUseCase: FindMatchMessagesUseCase,
  ) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.sendMessageUseCase.execute(user.id, createMessageDto);
  }

  @Get(':matchId')
  @Roles(...AUTHENTICATED_ROLES)
  findByMatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return this.findMatchMessagesUseCase.execute(user.id, matchId);
  }
}
