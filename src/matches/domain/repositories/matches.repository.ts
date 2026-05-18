import type { MatchSummary } from '../entities/match-summary';
import type { PublicUser } from '../../../users/domain/entities/public-user';

export interface EnsuredMatch {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
  firstUser: PublicUser;
  secondUser: PublicUser;
}

export abstract class MatchesRepository {
  abstract ensurePair(userAId: number, userBId: number): Promise<EnsuredMatch>;
  abstract findByUser(userId: number): Promise<MatchSummary[]>;
  abstract findAccessibleById(
    matchId: number,
    userId: number,
  ): Promise<EnsuredMatch | null>;
}
