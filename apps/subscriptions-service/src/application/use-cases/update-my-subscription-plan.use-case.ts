import { Injectable } from '@nestjs/common';

import { getSubscriptionPlanDetails } from '@app/common';
import { UpdateSubscriptionPlanDto } from '../../dto/update-subscription-plan.dto';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class UpdateMySubscriptionPlanUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute(userId: number, dto: UpdateSubscriptionPlanDto) {
    const user = await this.usersServiceClient.updatePlan(userId, dto.plan);

    return {
      user,
      details: getSubscriptionPlanDetails(user.plan),
    };
  }
}
