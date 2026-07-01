import type { PublicUser } from '@app/common';

export interface InteractionRecord {
  id: number;
  fromUserId: number;
  toUserId: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  createdAt: Date;
  updatedAt: Date;
  targetUser: PublicUser;
}
