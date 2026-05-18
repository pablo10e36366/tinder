import { Injectable } from '@nestjs/common';
import type { SubscriptionPlan } from '../../../subscriptions/domain/entities/subscription-plan';
import type { PublicUser } from '../../domain/entities/public-user';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class UpdateUserPlanUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(userId: number, plan: SubscriptionPlan): Promise<PublicUser> {
    return await this.usersRepository.updatePlan(userId, plan);
  }
}
