import { Injectable } from '@nestjs/common';

import type { EnsuredMatch } from '../../domain/repositories/matches.repository';
import {
  MatchesRepository,
  type StoredMatchSummary,
} from '../../domain/repositories/matches.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaMatchesRepository implements MatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildMatchPair(userAId: number, userBId: number) {
    return {
      user1Id: Math.min(userAId, userBId),
      user2Id: Math.max(userAId, userBId),
    };
  }

  async ensurePair(userAId: number, userBId: number): Promise<EnsuredMatch> {
    const pair = this.buildMatchPair(userAId, userBId);

    const match = await this.prisma.match.upsert({
      where: {
        user1Id_user2Id: pair,
      },
      create: pair,
      update: {},
    });

    return match;
  }

  async findByUser(userId: number): Promise<StoredMatchSummary[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        user1Id: true,
        user2Id: true,
      },
    });

    return matches.map((match) => {
      return {
        id: match.id,
        createdAt: match.createdAt,
        matchedUserId: match.user1Id === userId ? match.user2Id : match.user1Id,
      };
    });
  }

  async findAccessibleById(
    matchId: number,
    userId: number,
  ): Promise<EnsuredMatch | null> {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!match) {
      return null;
    }

    return match;
  }
}
