import type { PublicUser } from '../../../users/domain/entities/public-user';

export interface MatchSummary {
  id: number;
  createdAt: Date;
  matchedUser: PublicUser;
}
