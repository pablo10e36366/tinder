import type { MatchSummary } from '../../../matches/domain/entities/match-summary';
import type { PublicUser } from '../../../users/domain/entities/public-user';

export interface InteractionResult {
  id: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  targetUser: PublicUser;
  createdAt: Date;
  updatedAt: Date;
  isMatch: boolean;
  match: MatchSummary | null;
}
