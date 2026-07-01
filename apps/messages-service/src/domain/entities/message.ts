import type { PublicUser } from '@app/common';

export interface Message {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  sender: PublicUser;
}
