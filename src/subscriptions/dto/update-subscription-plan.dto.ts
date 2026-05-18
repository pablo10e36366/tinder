import type { SubscriptionPlan } from '../domain/entities/subscription-plan';

export class UpdateSubscriptionPlanDto {
  plan!: SubscriptionPlan;
}
