export interface EnsuredMatch {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
}

export interface StoredMatchSummary {
  id: number;
  createdAt: Date;
  matchedUserId: number;
}

export abstract class MatchesRepository {
  abstract ensurePair(userAId: number, userBId: number): Promise<EnsuredMatch>;
  abstract findByUser(userId: number): Promise<StoredMatchSummary[]>;
  abstract findAccessibleById(
    matchId: number,
    userId: number,
  ): Promise<EnsuredMatch | null>;
}
