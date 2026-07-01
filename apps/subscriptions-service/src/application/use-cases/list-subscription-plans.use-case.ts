import { Injectable } from '@nestjs/common';

import { getAllSubscriptionPlans } from '@app/common';

@Injectable()
export class ListSubscriptionPlansUseCase {
  execute() {
    return getAllSubscriptionPlans();
  }
}
