import type { SubscriptionPlan } from './subscription-plan';

export interface SubscriptionPlanDetails {
  code: SubscriptionPlan;
  name: string;
  description: string;
  superLikesPerDay: number | null;
  features: string[];
}
