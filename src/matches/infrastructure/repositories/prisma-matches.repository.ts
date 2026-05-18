import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { publicUserSelect } from '../../../shared/infrastructure/prisma/public-user.select';
import { normalizePublicUser } from '../../../shared/utils/normalize-public-user';
import type { MatchSummary } from '../../domain/entities/match-summary';
import type { EnsuredMatch } from '../../domain/repositories/matches.repository';
import { MatchesRepository } from '../../domain/repositories/matches.repository';

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
      include: {
        firstUser: {
          select: publicUserSelect,
        },
        secondUser: {
          select: publicUserSelect,
        },
      },
    });

    return {
      ...match,
      firstUser: normalizePublicUser(match.firstUser),
      secondUser: normalizePublicUser(match.secondUser),
    };
  }

  async findByUser(userId: number): Promise<MatchSummary[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        firstUser: {
          select: publicUserSelect,
        },
        secondUser: {
          select: publicUserSelect,
        },
      },
    });

    return matches.map((match) => {
      const matchedUser =
        match.user1Id === userId ? match.secondUser : match.firstUser;

      return {
        id: match.id,
        createdAt: match.createdAt,
        matchedUser: normalizePublicUser(matchedUser),
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
      include: {
        firstUser: {
          select: publicUserSelect,
        },
        secondUser: {
          select: publicUserSelect,
        },
      },
    });

    if (!match) {
      return null;
    }

    return {
      ...match,
      firstUser: normalizePublicUser(match.firstUser),
      secondUser: normalizePublicUser(match.secondUser),
    };
  }
}
