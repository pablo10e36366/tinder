import { Injectable, NotFoundException } from '@nestjs/common';
import { FindPublicUserByIdUseCase } from '../../../users/application/use-cases/find-public-user-by-id.use-case';
import { getSubscriptionPlanDetails } from '../../domain/services/subscription-plan-policy';

@Injectable()
export class FindMySubscriptionUseCase {
  constructor(
    private readonly findPublicUserByIdUseCase: FindPublicUserByIdUseCase,
  ) {}

  async execute(userId: number) {
    const user = await this.findPublicUserByIdUseCase.execute(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      currentPlan: user.plan,
      details: getSubscriptionPlanDetails(user.plan),
    };
  }
}
