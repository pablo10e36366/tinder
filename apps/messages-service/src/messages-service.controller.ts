import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/common';
import { FindMatchMessagesUseCase } from './application/use-cases/find-match-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { CreateMessageDto } from './dto/create-message.dto';

type SendMessagePayload = {
  senderId: number;
  dto: CreateMessageDto;
};

type FindByMatchPayload = {
  userId: number;
  matchId: number;
};

@Controller()
export class MessagesServiceController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly findMatchMessagesUseCase: FindMatchMessagesUseCase,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.messages.send)
  async send(@Payload() payload: SendMessagePayload) {
    return await this.sendMessageUseCase.execute(payload.senderId, payload.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.messages.findByMatch)
  async findByMatch(@Payload() payload: FindByMatchPayload) {
    return await this.findMatchMessagesUseCase.execute(
      payload.userId,
      payload.matchId,
    );
  }
}
