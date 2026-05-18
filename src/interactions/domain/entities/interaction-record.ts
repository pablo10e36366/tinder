import type { PublicUser } from '../../../users/domain/entities/public-user';

export interface InteractionRecord {
  id: number;
  fromUserId: number;
  toUserId: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  createdAt: Date;
  updatedAt: Date;
  targetUser: PublicUser;
}
