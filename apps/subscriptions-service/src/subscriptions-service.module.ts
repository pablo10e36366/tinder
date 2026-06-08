import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient as SubscriptionsPrismaClient,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '../../../prisma/services/subscriptions/generated/client';
import {
  AUTHENTICATED_ROLES,
  CurrentUser,
  Public,
  Roles,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type { AuthenticatedUser as AuthenticatedUserType } from '../../common/src/auth';
import { UpdateSubscriptionPlanDto } from '../../../src/subscriptions/dto/update-subscription-plan.dto';
import {
  getAllSubscriptionPlans,
  getSubscriptionPlanDetails,
} from '../../../src/subscriptions/domain/services/subscription-plan-policy';

@Injectable()
class SubscriptionsPrismaService
  extends SubscriptionsPrismaClient
  implements OnModuleInit
{
  constructor() {
    const connectionString = process.env.SUBSCRIPTIONS_DATABASE_URL;

    if (!connectionString) {
      throw new Error('SUBSCRIPTIONS_DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

@Injectable()
class SubscriptionsAppService implements OnModuleInit {
  constructor(private readonly prisma: SubscriptionsPrismaService) {}

  async onModuleInit() {
    for (const plan of getAllSubscriptionPlans()) {
      await this.prisma.subscriptionPlan.upsert({
        where: { code: plan.code as SubscriptionPlanCode },
        update: {
          name: plan.name,
          description: plan.description,
          superlikesPerDay: plan.superLikesPerDay,
          features: plan.features,
        },
        create: {
          code: plan.code as SubscriptionPlanCode,
          name: plan.name,
          description: plan.description,
          superlikesPerDay: plan.superLikesPerDay,
          features: plan.features,
        },
      });
    }
  }

  private async ensureActiveSubscription(userId: number) {
    const existing = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.userSubscription.create({
      data: {
        userId,
        planCode: SubscriptionPlanCode.FREE,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
      },
    });
  }

  private async buildSubscriptionResponse(userId: number) {
    const subscription = await this.ensureActiveSubscription(userId);

    return {
      userId,
      plan: subscription.planCode,
      details: getSubscriptionPlanDetails(subscription.planCode),
    };
  }

  async listPlans() {
    return getAllSubscriptionPlans();
  }

  async findMine(userId: number) {
    return await this.buildSubscriptionResponse(userId);
  }

  async updateMine(userId: number, dto: UpdateSubscriptionPlanDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.updateMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      await tx.userSubscription.create({
        data: {
          userId,
          planCode: dto.plan as SubscriptionPlanCode,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
        },
      });
    });

    return await this.buildSubscriptionResponse(userId);
  }

  async ensureDefault(userId: number) {
    return await this.ensureActiveSubscription(userId);
  }

  async findCurrent(userId: number) {
    return await this.buildSubscriptionResponse(userId);
  }
}

@Controller()
class SubscriptionsServiceController {
  constructor(
    private readonly subscriptionsAppService: SubscriptionsAppService,
  ) {}

  @Public()
  @Get('subscriptions/plans')
  listPlans() {
    return this.subscriptionsAppService.listPlans();
  }

  @Get('subscriptions/me')
  @Roles(...AUTHENTICATED_ROLES)
  findMine(@CurrentUser() user: AuthenticatedUserType) {
    return this.subscriptionsAppService.findMine(user.id);
  }

  @Patch('subscriptions/me')
  @Roles(...AUTHENTICATED_ROLES)
  updateMine(
    @CurrentUser() user: AuthenticatedUserType,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionsAppService.updateMine(user.id, dto);
  }

  @Public()
  @Post('internal/users/:userId/ensure-default')
  ensureDefault(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsAppService.ensureDefault(userId);
  }

  @Public()
  @Get('internal/users/:userId/current')
  findCurrent(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsAppService.findCurrent(userId);
  }
}

@Module({
  imports: [...sharedAuthImports],
  controllers: [SubscriptionsServiceController],
  providers: [
    SubscriptionsPrismaService,
    SubscriptionsAppService,
    ...sharedAuthProviders,
  ],
})
export class SubscriptionsServiceModule {}
