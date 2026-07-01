import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { FindMySubscriptionUseCase } from './application/use-cases/find-my-subscription.use-case';
import { ListSubscriptionPlansUseCase } from './application/use-cases/list-subscription-plans.use-case';
import { UpdateMySubscriptionPlanUseCase } from './application/use-cases/update-my-subscription-plan.use-case';
import { UsersServiceClient } from './infrastructure/clients/users-service.client';
import { SubscriptionsServiceController } from './subscriptions-service.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USERS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.USERS_SERVICE_PORT ?? 3002),
        },
      },
    ]),
  ],
  controllers: [SubscriptionsServiceController],
  providers: [
    ListSubscriptionPlansUseCase,
    FindMySubscriptionUseCase,
    UpdateMySubscriptionPlanUseCase,
    UsersServiceClient,
  ],
})
export class SubscriptionsServiceModule {}
