import { Injectable } from '@nestjs/common';
import type { MatchSummary } from '../../domain/entities/match-summary';
import { MatchesRepository } from '../../domain/repositories/matches.repository';

@Injectable()
export class FindMyMatchesUseCase {
  constructor(private readonly matchesRepository: MatchesRepository) {}

  async execute(userId: number): Promise<MatchSummary[]> {
    return await this.matchesRepository.findByUser(userId);
  }
}
