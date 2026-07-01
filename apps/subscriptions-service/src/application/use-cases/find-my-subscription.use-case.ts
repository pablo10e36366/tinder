import { Injectable } from '@nestjs/common';

import { getSubscriptionPlanDetails } from '@app/common';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindMySubscriptionUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute(userId: number) {
    const user = await this.usersServiceClient.findPublicById(userId);

    return {
      currentPlan: user.plan,
      details: getSubscriptionPlanDetails(user.plan),
    };
  }
}
