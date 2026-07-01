import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/common';
import { FindMySubscriptionUseCase } from './application/use-cases/find-my-subscription.use-case';
import { ListSubscriptionPlansUseCase } from './application/use-cases/list-subscription-plans.use-case';
import { UpdateMySubscriptionPlanUseCase } from './application/use-cases/update-my-subscription-plan.use-case';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

type UserIdPayload = {
  userId: number;
};

type UpdateMinePayload = {
  userId: number;
  dto: UpdateSubscriptionPlanDto;
};

@Controller()
export class SubscriptionsServiceController {
  constructor(
    private readonly listSubscriptionPlansUseCase: ListSubscriptionPlansUseCase,
    private readonly findMySubscriptionUseCase: FindMySubscriptionUseCase,
    private readonly updateMySubscriptionPlanUseCase: UpdateMySubscriptionPlanUseCase,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.subscriptions.listPlans)
  listPlans() {
    return this.listSubscriptionPlansUseCase.execute();
  }

  @MessagePattern(MESSAGE_PATTERNS.subscriptions.findMine)
  async findMine(@Payload() payload: UserIdPayload) {
    return await this.findMySubscriptionUseCase.execute(payload.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.subscriptions.updateMine)
  async updateMine(@Payload() payload: UpdateMinePayload) {
    return await this.updateMySubscriptionPlanUseCase.execute(
      payload.userId,
      payload.dto,
    );
  }
}
