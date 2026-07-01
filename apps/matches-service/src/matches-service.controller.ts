import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/common';
import { EnsureMatchUseCase } from './application/use-cases/ensure-match.use-case';
import { FindAccessibleMatchByIdUseCase } from './application/use-cases/find-accessible-match-by-id.use-case';
import { FindMyMatchesUseCase } from './application/use-cases/find-my-matches.use-case';

type UserIdPayload = {
  userId: number;
};

type EnsureMatchPayload = {
  userAId: number;
  userBId: number;
};

type AccessibleMatchPayload = {
  matchId: number;
  userId: number;
};

@Controller()
export class MatchesServiceController {
  constructor(
    private readonly ensureMatchUseCase: EnsureMatchUseCase,
    private readonly findMyMatchesUseCase: FindMyMatchesUseCase,
    private readonly findAccessibleMatchByIdUseCase: FindAccessibleMatchByIdUseCase,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.matches.ensurePair)
  async ensurePair(@Payload() payload: EnsureMatchPayload) {
    return await this.ensureMatchUseCase.execute(
      payload.userAId,
      payload.userBId,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.matches.findMine)
  async findMine(@Payload() payload: UserIdPayload) {
    return await this.findMyMatchesUseCase.execute(payload.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.matches.findAccessibleById)
  async findAccessibleById(@Payload() payload: AccessibleMatchPayload) {
    return await this.findAccessibleMatchByIdUseCase.execute(
      payload.matchId,
      payload.userId,
    );
  }
}
