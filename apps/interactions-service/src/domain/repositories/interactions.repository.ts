import type { CreateInteractionDto } from '../../dto/create-interaction.dto';

export interface StoredInteraction {
  id: number;
  fromUserId: number;
  toUserId: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  createdAt: Date;
  updatedAt: Date;
}

export abstract class InteractionsRepository {
  abstract createOrUpdate(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ): Promise<StoredInteraction>;

  abstract findReverseInteraction(
    fromUserId: number,
    toUserId: number,
  ): Promise<StoredInteraction | null>;

  abstract findSentByUser(userId: number): Promise<StoredInteraction[]>;
  abstract countSentTypeSince(
    userId: number,
    type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE',
    since: Date,
  ): Promise<number>;
}
