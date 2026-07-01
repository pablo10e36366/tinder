import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { CreateOrUpdateInteractionUseCase } from './application/use-cases/create-or-update-interaction.use-case';
import { FindSentInteractionsUseCase } from './application/use-cases/find-sent-interactions.use-case';
import { InteractionsRepository } from './domain/repositories/interactions.repository';
import { MatchesServiceClient } from './infrastructure/clients/matches-service.client';
import { PrismaInteractionsRepository } from './infrastructure/repositories/prisma-interactions.repository';
import { UsersServiceClient } from './infrastructure/clients/users-service.client';
import { InteractionsServiceController } from './interactions-service.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USERS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.USERS_SERVICE_PORT ?? 3002),
        },
      },
      {
        name: 'MATCHES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MATCHES_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MATCHES_SERVICE_PORT ?? 3005),
        },
      },
    ]),
  ],
  controllers: [InteractionsServiceController],
  providers: [
    CreateOrUpdateInteractionUseCase,
    FindSentInteractionsUseCase,
    UsersServiceClient,
    MatchesServiceClient,
    PrismaInteractionsRepository,
    {
      provide: InteractionsRepository,
      useExisting: PrismaInteractionsRepository,
    },
  ],
})
export class InteractionsServiceModule {}
