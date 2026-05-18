import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesController } from './matches.controller';
import { EnsureMatchUseCase } from './application/use-cases/ensure-match.use-case';
import { FindAccessibleMatchByIdUseCase } from './application/use-cases/find-accessible-match-by-id.use-case';
import { FindMyMatchesUseCase } from './application/use-cases/find-my-matches.use-case';
import { MatchesRepository } from './domain/repositories/matches.repository';
import { PrismaMatchesRepository } from './infrastructure/repositories/prisma-matches.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController],
  providers: [
    EnsureMatchUseCase,
    FindAccessibleMatchByIdUseCase,
    FindMyMatchesUseCase,
    PrismaMatchesRepository,
    {
      provide: MatchesRepository,
      useExisting: PrismaMatchesRepository,
    },
  ],
  exports: [
    EnsureMatchUseCase,
    FindAccessibleMatchByIdUseCase,
    MatchesRepository,
  ],
})
export class MatchesModule {}
