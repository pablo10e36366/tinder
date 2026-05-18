import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FindMySubscriptionUseCase } from './application/use-cases/find-my-subscription.use-case';
import { ListSubscriptionPlansUseCase } from './application/use-cases/list-subscription-plans.use-case';
import { UpdateMySubscriptionPlanUseCase } from './application/use-cases/update-my-subscription-plan.use-case';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [UsersModule],
  controllers: [SubscriptionsController],
  providers: [
    ListSubscriptionPlansUseCase,
    FindMySubscriptionUseCase,
    UpdateMySubscriptionPlanUseCase,
  ],
  exports: [FindMySubscriptionUseCase],
})
export class SubscriptionsModule {}
