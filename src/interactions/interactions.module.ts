import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InteractionsController } from './interactions.controller';
import { CreateOrUpdateInteractionUseCase } from './application/use-cases/create-or-update-interaction.use-case';
import { FindSentInteractionsUseCase } from './application/use-cases/find-sent-interactions.use-case';
import { InteractionsRepository } from './domain/repositories/interactions.repository';
import { PrismaInteractionsRepository } from './infrastructure/repositories/prisma-interactions.repository';

@Module({
  imports: [PrismaModule, UsersModule, MatchesModule],
  controllers: [InteractionsController],
  providers: [
    CreateOrUpdateInteractionUseCase,
    FindSentInteractionsUseCase,
    PrismaInteractionsRepository,
    {
      provide: InteractionsRepository,
      useExisting: PrismaInteractionsRepository,
    },
  ],
})
export class InteractionsModule {}
