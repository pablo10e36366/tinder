import type { PublicUser } from '../../../users/domain/entities/public-user';
import type { CreateInteractionDto } from '../../dto/create-interaction.dto';
import type { InteractionRecord } from '../entities/interaction-record';

export interface StoredInteraction {
  id: number;
  fromUserId: number;
  toUserId: number;
  type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE';
  createdAt: Date;
  updatedAt: Date;
  targetUser: PublicUser;
}

export abstract class InteractionsRepository {
  abstract createOrUpdate(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ): Promise<StoredInteraction>;

  abstract findReverseInteraction(
    fromUserId: number,
    toUserId: number,
  ): Promise<InteractionRecord | null>;

  abstract findSentByUser(userId: number): Promise<InteractionRecord[]>;
  abstract countSentTypeSince(
    userId: number,
    type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE',
    since: Date,
  ): Promise<number>;
}
