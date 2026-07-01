import type { PublicUser } from '@app/common';

interface MatchSummary {
  id: number;
  createdAt: Date;
  matchedUser: PublicUser;
}

export interface InteractionResult {
  id: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  targetUser: PublicUser;
  createdAt: Date;
  updatedAt: Date;
  isMatch: boolean;
  match: MatchSummary | null;
}
