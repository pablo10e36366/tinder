import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  MatchStatus,
  PrismaClient as MatchesPrismaClient,
} from '../../../prisma/services/matches/generated/client';
import {
  AUTHENTICATED_ROLES,
  CurrentUser,
  Public,
  Roles,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type { AuthenticatedUser as AuthenticatedUserType } from '../../common/src/auth';
import { requestJson } from '../../common/src/http';

interface UserProfileResponse {
  id: number;
  name: string;
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}

interface EnsureMatchDto {
  userAId: number;
  userBId: number;
  sourceInteractionId?: number;
}

@Injectable()
class MatchesPrismaService extends MatchesPrismaClient {
  constructor() {
    const connectionString = process.env.MATCHES_DATABASE_URL;

    if (!connectionString) {
      throw new Error('MATCHES_DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }
}

@Injectable()
class UsersInternalClient {
  private readonly baseUrl =
    process.env.USERS_SERVICE_URL ?? 'http://localhost:3002';

  async findPublicById(userId: number): Promise<UserProfileResponse> {
    return await requestJson<UserProfileResponse>(
      `${this.baseUrl}/users/internal/public/${userId}`,
    );
  }
}

@Injectable()
class MatchesAppService {
  constructor(
    private readonly prisma: MatchesPrismaService,
    private readonly usersClient: UsersInternalClient,
  ) {}

  private normalizePair(userAId: number, userBId: number) {
    return userAId < userBId
      ? { userAId, userBId }
      : { userAId: userBId, userBId: userAId };
  }

  async ensureMatch(dto: EnsureMatchDto) {
    const pair = this.normalizePair(dto.userAId, dto.userBId);

    const existing = await this.prisma.match.findUnique({
      where: {
        userAId_userBId: pair,
      },
    });

    if (existing) {
      if (existing.status === MatchStatus.ACTIVE) {
        return existing;
      }

      return await this.prisma.match.update({
        where: { id: existing.id },
        data: {
          status: MatchStatus.ACTIVE,
          closedAt: null,
        },
      });
    }

    return await this.prisma.match.create({
      data: {
        ...pair,
        createdByInteractionId: dto.sourceInteractionId,
      },
    });
  }

  async findMine(userId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.ACTIVE,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return await Promise.all(
      matches.map(async (match) => {
        const matchedUserId = match.userAId === userId ? match.userBId : match.userAId;
        const matchedUser = await this.usersClient.findPublicById(matchedUserId);

        return {
          id: match.id,
          createdAt: match.createdAt,
          matchedUser,
        };
      }),
    );
  }

  async findAccessibleMatch(matchId: number, userId: number) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || match.status !== MatchStatus.ACTIVE) {
      throw new NotFoundException('El match no existe');
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new NotFoundException('El match no existe');
    }

    return match;
  }
}

@Controller()
class MatchesServiceController {
  constructor(private readonly matchesAppService: MatchesAppService) {}

  @Get('matches')
  @Roles(...AUTHENTICATED_ROLES)
  findMine(@CurrentUser() user: AuthenticatedUserType) {
    return this.matchesAppService.findMine(user.id);
  }

  @Public()
  @Post('internal/matches/ensure')
  ensureMatch(@Body() dto: EnsureMatchDto) {
    return this.matchesAppService.ensureMatch(dto);
  }

  @Public()
  @Get('internal/matches/:matchId/access/:userId')
  findAccessibleMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.matchesAppService.findAccessibleMatch(matchId, userId);
  }
}

@Module({
  imports: [...sharedAuthImports],
  controllers: [MatchesServiceController],
  providers: [
    MatchesPrismaService,
    UsersInternalClient,
    MatchesAppService,
    ...sharedAuthProviders,
  ],
})
export class MatchesServiceModule {}
