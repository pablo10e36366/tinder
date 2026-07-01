import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { EnsureMatchUseCase } from './application/use-cases/ensure-match.use-case';
import { FindAccessibleMatchByIdUseCase } from './application/use-cases/find-accessible-match-by-id.use-case';
import { FindMyMatchesUseCase } from './application/use-cases/find-my-matches.use-case';
import { MatchesRepository } from './domain/repositories/matches.repository';
import { UsersServiceClient } from './infrastructure/clients/users-service.client';
import { PrismaMatchesRepository } from './infrastructure/repositories/prisma-matches.repository';
import { MatchesServiceController } from './matches-service.controller';
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
    ]),
  ],
  controllers: [MatchesServiceController],
  providers: [
    EnsureMatchUseCase,
    FindAccessibleMatchByIdUseCase,
    FindMyMatchesUseCase,
    UsersServiceClient,
    PrismaMatchesRepository,
    {
      provide: MatchesRepository,
      useExisting: PrismaMatchesRepository,
    },
  ],
})
export class MatchesServiceModule {}
