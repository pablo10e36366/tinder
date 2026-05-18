import { Injectable } from '@nestjs/common';
import { UpdateUserPlanUseCase } from '../../../users/application/use-cases/update-user-plan.use-case';
import { getSubscriptionPlanDetails } from '../../domain/services/subscription-plan-policy';
import { UpdateSubscriptionPlanDto } from '../../dto/update-subscription-plan.dto';

@Injectable()
export class UpdateMySubscriptionPlanUseCase {
  constructor(private readonly updateUserPlanUseCase: UpdateUserPlanUseCase) {}

  async execute(userId: number, dto: UpdateSubscriptionPlanDto) {
    const user = await this.updateUserPlanUseCase.execute(userId, dto.plan);

    return {
      user,
      details: getSubscriptionPlanDetails(user.plan),
    };
  }
}
