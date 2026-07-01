import { Injectable } from '@nestjs/common';

import { CreateInteractionDto } from '../../dto/create-interaction.dto';
import type { StoredInteraction } from '../../domain/repositories/interactions.repository';
import { InteractionsRepository } from '../../domain/repositories/interactions.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaInteractionsRepository implements InteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ): Promise<StoredInteraction> {
    const interaction = await this.prisma.userInteraction.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: createInteractionDto.targetUserId,
        },
      },
      create: {
        fromUserId: userId,
        toUserId: createInteractionDto.targetUserId,
        type: createInteractionDto.type,
      },
      update: {
        type: createInteractionDto.type,
      },
    });

    return interaction;
  }

  async findReverseInteraction(
    fromUserId: number,
    toUserId: number,
  ): Promise<StoredInteraction | null> {
    const interaction = await this.prisma.userInteraction.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    return interaction;
  }

  async findSentByUser(userId: number): Promise<StoredInteraction[]> {
    return await this.prisma.userInteraction.findMany({
      where: { fromUserId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async countSentTypeSince(
    userId: number,
    type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE',
    since: Date,
  ): Promise<number> {
    return await this.prisma.userInteraction.count({
      where: {
        fromUserId: userId,
        type,
        updatedAt: {
          gte: since,
        },
      },
    });
  }
}
