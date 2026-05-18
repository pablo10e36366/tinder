import type { SubscriptionPlanDetails } from '../entities/subscription-plan-details';
import type { SubscriptionPlan } from '../entities/subscription-plan';

const subscriptionPlans: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    description: 'Plan basico con funciones esenciales',
    superLikesPerDay: 1,
    features: [
      'Likes y dislikes basicos',
      '1 superlike por dia',
      'Chat con matches',
    ],
  },
  GOLD: {
    code: 'GOLD',
    name: 'Gold',
    description: 'Mas visibilidad y mas interacciones premium',
    superLikesPerDay: 5,
    features: [
      'Todo lo de Free',
      '5 superlikes por dia',
      'Mayor flexibilidad para destacar perfiles',
    ],
  },
  PREMIUM: {
    code: 'PREMIUM',
    name: 'Premium',
    description: 'Experiencia completa sin limite de superlikes',
    superLikesPerDay: null,
    features: [
      'Todo lo de Gold',
      'Superlikes ilimitados',
      'Maxima prioridad para funciones premium futuras',
    ],
  },
};

export function getSubscriptionPlanDetails(
  plan: SubscriptionPlan,
): SubscriptionPlanDetails {
  return subscriptionPlans[plan];
}

export function getAllSubscriptionPlans(): SubscriptionPlanDetails[] {
  return Object.values(subscriptionPlans);
}
