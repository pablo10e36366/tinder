import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FindMySubscriptionUseCase } from './application/use-cases/find-my-subscription.use-case';
import { ListSubscriptionPlansUseCase } from './application/use-cases/list-subscription-plans.use-case';
import { UpdateMySubscriptionPlanUseCase } from './application/use-cases/update-my-subscription-plan.use-case';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly listSubscriptionPlansUseCase: ListSubscriptionPlansUseCase,
    private readonly findMySubscriptionUseCase: FindMySubscriptionUseCase,
    private readonly updateMySubscriptionPlanUseCase: UpdateMySubscriptionPlanUseCase,
  ) {}

  @Public()
  @Get('plans')
  findPlans() {
    return this.listSubscriptionPlansUseCase.execute();
  }

  @Get('me')
  @Roles(...AUTHENTICATED_ROLES)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.findMySubscriptionUseCase.execute(user.id);
  }

  @Patch('me')
  @Roles(...AUTHENTICATED_ROLES)
  updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ) {
    return this.updateMySubscriptionPlanUseCase.execute(
      user.id,
      updateSubscriptionPlanDto,
    );
  }
}
