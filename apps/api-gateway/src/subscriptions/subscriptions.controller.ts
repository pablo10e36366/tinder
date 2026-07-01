import { Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  MESSAGE_PATTERNS,
  type AuthenticatedUser,
  UpdateSubscriptionPlanDto,
} from '@app/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    @Inject('SUBSCRIPTIONS_SERVICE')
    private readonly subscriptionsClient: ClientProxy,
  ) {}

  @Public()
  @Get('plans')
  async findPlans() {
    return await firstValueFrom(
      this.subscriptionsClient.send(MESSAGE_PATTERNS.subscriptions.listPlans, {}),
    );
  }

  @Get('me')
  @Roles(...AUTHENTICATED_ROLES)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return await firstValueFrom(
      this.subscriptionsClient.send(MESSAGE_PATTERNS.subscriptions.findMine, {
        userId: user.id,
      }),
    );
  }

  @Patch('me')
  @Roles(...AUTHENTICATED_ROLES)
  async updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ) {
    return await firstValueFrom(
      this.subscriptionsClient.send(MESSAGE_PATTERNS.subscriptions.updateMine, {
        userId: user.id,
        dto: updateSubscriptionPlanDto,
      }),
    );
  }
}
