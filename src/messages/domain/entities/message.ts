import type { PublicUser } from '../../../users/domain/entities/public-user';

export interface Message {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  sender: PublicUser;
}
