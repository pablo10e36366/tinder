import type { PublicUser } from '@app/common';

export interface MatchSummary {
  id: number;
  createdAt: Date;
  matchedUser: PublicUser;
}
