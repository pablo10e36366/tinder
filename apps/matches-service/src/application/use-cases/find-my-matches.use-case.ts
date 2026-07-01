import { Injectable } from '@nestjs/common';

import type { MatchSummary } from '../../domain/entities/match-summary';
import { MatchesRepository } from '../../domain/repositories/matches.repository';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindMyMatchesUseCase {
  constructor(
    private readonly matchesRepository: MatchesRepository,
    private readonly usersServiceClient: UsersServiceClient,
  ) {}

  async execute(userId: number): Promise<MatchSummary[]> {
    const matches = await this.matchesRepository.findByUser(userId);

    return await Promise.all(
      matches.map(async (match) => ({
        id: match.id,
        createdAt: match.createdAt,
        matchedUser: await this.usersServiceClient.findPublicById(
          match.matchedUserId,
        ),
      })),
    );
  }
}
