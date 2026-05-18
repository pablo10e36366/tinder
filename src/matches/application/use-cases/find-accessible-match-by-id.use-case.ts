import { Injectable } from '@nestjs/common';
import type { EnsuredMatch } from '../../domain/repositories/matches.repository';
import { MatchesRepository } from '../../domain/repositories/matches.repository';

@Injectable()
export class FindAccessibleMatchByIdUseCase {
  constructor(private readonly matchesRepository: MatchesRepository) {}

  async execute(matchId: number, userId: number): Promise<EnsuredMatch | null> {
    return await this.matchesRepository.findAccessibleById(matchId, userId);
  }
}
