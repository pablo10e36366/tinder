import type { SubscriptionPlan } from '../subscriptions/subscription-plan';

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  plan: SubscriptionPlan;
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}
