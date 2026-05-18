import { Injectable } from '@nestjs/common';
import { getAllSubscriptionPlans } from '../../domain/services/subscription-plan-policy';

@Injectable()
export class ListSubscriptionPlansUseCase {
  execute() {
    return getAllSubscriptionPlans();
  }
}
