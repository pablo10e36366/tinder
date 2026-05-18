import { Injectable } from '@nestjs/common';
import type { EnsuredMatch } from '../../domain/repositories/matches.repository';
import { MatchesRepository } from '../../domain/repositories/matches.repository';

@Injectable()
export class EnsureMatchUseCase {
  constructor(private readonly matchesRepository: MatchesRepository) {}

  async execute(userAId: number, userBId: number): Promise<EnsuredMatch> {
    return await this.matchesRepository.ensurePair(userAId, userBId);
  }
}
