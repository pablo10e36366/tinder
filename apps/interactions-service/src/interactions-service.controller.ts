import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/common';
import { CreateOrUpdateInteractionUseCase } from './application/use-cases/create-or-update-interaction.use-case';
import { FindSentInteractionsUseCase } from './application/use-cases/find-sent-interactions.use-case';
import { CreateInteractionDto } from './dto/create-interaction.dto';

type CreateInteractionPayload = {
  userId: number;
  dto: CreateInteractionDto;
};

type UserIdPayload = {
  userId: number;
};

@Controller()
export class InteractionsServiceController {
  constructor(
    private readonly createOrUpdateInteractionUseCase: CreateOrUpdateInteractionUseCase,
    private readonly findSentInteractionsUseCase: FindSentInteractionsUseCase,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.interactions.createOrUpdate)
  async createOrUpdate(@Payload() payload: CreateInteractionPayload) {
    return await this.createOrUpdateInteractionUseCase.execute(
      payload.userId,
      payload.dto,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.interactions.findSent)
  async findSent(@Payload() payload: UserIdPayload) {
    return await this.findSentInteractionsUseCase.execute(payload.userId);
  }
}
