import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  InteractionType,
  PrismaClient as InteractionsPrismaClient,
} from '../../../prisma/services/interactions/generated/client';
import {
  AUTHENTICATED_ROLES,
  CurrentUser,
  Roles,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type { AuthenticatedUser as AuthenticatedUserType } from '../../common/src/auth';
import { requestJson } from '../../common/src/http';
import { CreateInteractionDto } from '../../../src/interactions/dto/create-interaction.dto';

interface UserProfileResponse {
  id: number;
  name: string;
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}

interface SubscriptionResponse {
  userId: number;
  plan: string;
  details: {
    superLikesPerDay: number | null;
  };
}

interface MatchResponse {
  id: number;
  userAId: number;
  userBId: number;
  createdAt: string;
}

@Injectable()
class InteractionsPrismaService extends InteractionsPrismaClient {
  constructor() {
    const connectionString = process.env.INTERACTIONS_DATABASE_URL;

    if (!connectionString) {
      throw new Error('INTERACTIONS_DATABASE_URL is not defined');
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
class SubscriptionsInternalClient {
  private readonly baseUrl =
    process.env.SUBSCRIPTIONS_SERVICE_URL ?? 'http://localhost:3003';

  async findCurrent(userId: number): Promise<SubscriptionResponse> {
    return await requestJson<SubscriptionResponse>(
      `${this.baseUrl}/internal/users/${userId}/current`,
    );
  }
}

@Injectable()
class MatchesInternalClient {
  private readonly baseUrl =
    process.env.MATCHES_SERVICE_URL ?? 'http://localhost:3005';

  async ensureMatch(
    userAId: number,
    userBId: number,
    sourceInteractionId?: number,
  ): Promise<MatchResponse> {
    return await requestJson<MatchResponse>(
      `${this.baseUrl}/internal/matches/ensure`,
      {
        method: 'POST',
        body: JSON.stringify({
          userAId,
          userBId,
          sourceInteractionId,
        }),
      },
    );
  }
}

@Injectable()
class InteractionsAppService {
  constructor(
    private readonly prisma: InteractionsPrismaService,
    private readonly usersClient: UsersInternalClient,
    private readonly subscriptionsClient: SubscriptionsInternalClient,
    private readonly matchesClient: MatchesInternalClient,
  ) {}

  private async syncCapability(userId: number) {
    const subscription = await this.subscriptionsClient.findCurrent(userId);

    return await this.prisma.interactionUserCapability.upsert({
      where: { userId },
      update: {
        planCode: subscription.plan,
        superlikesPerDay: subscription.details.superLikesPerDay,
        isActive: true,
      },
      create: {
        userId,
        planCode: subscription.plan,
        superlikesPerDay: subscription.details.superLikesPerDay,
        isActive: true,
      },
    });
  }

  async createOrUpdate(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ) {
    const { targetUserId, type } = createInteractionDto;

    if (userId === targetUserId) {
      throw new BadRequestException('No puedes interactuar contigo mismo');
    }

    const targetUser = await this.usersClient.findPublicById(targetUserId).catch(
      () => null,
    );

    if (!targetUser) {
      throw new NotFoundException('El usuario objetivo no existe');
    }

    const capability = await this.syncCapability(userId);
    const existingInteraction = await this.prisma.userInteraction.findUnique({
      where: {
        actorUserId_targetUserId: {
          actorUserId: userId,
          targetUserId,
        },
      },
    });

    const shouldCountSuperLike =
      type === 'SUPERLIKE' && existingInteraction?.type !== InteractionType.SUPERLIKE;

    if (
      shouldCountSuperLike &&
      capability.superlikesPerDay !== null &&
      capability.superlikesPerDay !== undefined
    ) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const counter = await this.prisma.interactionDailyCounter.findUnique({
        where: {
          userId_counterDate: {
            userId,
            counterDate: startOfDay,
          },
        },
      });

      if ((counter?.superlikesUsed ?? 0) >= capability.superlikesPerDay) {
        throw new ForbiddenException(
          `Tu plan ${capability.planCode} ya alcanzo el limite diario de superlikes`,
        );
      }
    }

    const interaction = await this.prisma.userInteraction.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId: userId,
          targetUserId,
        },
      },
      update: {
        type: type as InteractionType,
      },
      create: {
        actorUserId: userId,
        targetUserId,
        type: type as InteractionType,
      },
    });

    if (shouldCountSuperLike) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      await this.prisma.interactionDailyCounter.upsert({
        where: {
          userId_counterDate: {
            userId,
            counterDate: startOfDay,
          },
        },
        update: {
          superlikesUsed: {
            increment: 1,
          },
        },
        create: {
          userId,
          counterDate: startOfDay,
          superlikesUsed: 1,
        },
      });
    }

    let match: { id: number; createdAt: string | Date; matchedUser: UserProfileResponse } | null =
      null;

    if (type === 'LIKE' || type === 'SUPERLIKE') {
      const reverseInteraction = await this.prisma.userInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: targetUserId,
            targetUserId: userId,
          },
        },
      });

      const isMutualLike =
        reverseInteraction?.type === InteractionType.LIKE ||
        reverseInteraction?.type === InteractionType.SUPERLIKE;

      if (isMutualLike) {
        const ensuredMatch = await this.matchesClient.ensureMatch(
          userId,
          targetUserId,
          interaction.id,
        );

        match = {
          id: ensuredMatch.id,
          createdAt: ensuredMatch.createdAt,
          matchedUser: targetUser,
        };
      }
    }

    return {
      id: interaction.id,
      type: interaction.type,
      targetUser,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
      isMatch: Boolean(match),
      match,
    };
  }

  async findSent(userId: number) {
    const interactions = await this.prisma.userInteraction.findMany({
      where: {
        actorUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return await Promise.all(
      interactions.map(async (interaction) => ({
        id: interaction.id,
        type: interaction.type,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        targetUser: await this.usersClient.findPublicById(interaction.targetUserId),
      })),
    );
  }
}

@Controller('interactions')
class InteractionsServiceController {
  constructor(private readonly interactionsAppService: InteractionsAppService) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  createOrUpdate(
    @CurrentUser() user: AuthenticatedUserType,
    @Body() createInteractionDto: CreateInteractionDto,
  ) {
    return this.interactionsAppService.createOrUpdate(
      user.id,
      createInteractionDto,
    );
  }

  @Get('sent')
  @Roles(...AUTHENTICATED_ROLES)
  findSent(@CurrentUser() user: AuthenticatedUserType) {
    return this.interactionsAppService.findSent(user.id);
  }
}

@Module({
  imports: [...sharedAuthImports],
  controllers: [InteractionsServiceController],
  providers: [
    InteractionsPrismaService,
    UsersInternalClient,
    SubscriptionsInternalClient,
    MatchesInternalClient,
    InteractionsAppService,
    ...sharedAuthProviders,
  ],
})
export class InteractionsServiceModule {}
