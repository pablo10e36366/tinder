import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { getSubscriptionPlanDetails } from '@app/common';
import { CreateInteractionDto } from '../../dto/create-interaction.dto';
import type { InteractionResult } from '../../domain/entities/interaction-result';
import { InteractionsRepository } from '../../domain/repositories/interactions.repository';
import { MatchesServiceClient } from '../../infrastructure/clients/matches-service.client';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class CreateOrUpdateInteractionUseCase {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly usersServiceClient: UsersServiceClient,
    private readonly matchesServiceClient: MatchesServiceClient,
  ) {}

  async execute(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ): Promise<InteractionResult> {
    const { targetUserId, type } = createInteractionDto;

    if (userId === targetUserId) {
      throw new BadRequestException('No puedes interactuar contigo mismo');
    }

    const targetUser = await this.usersServiceClient.findPublicById(targetUserId);
    const currentUser = await this.usersServiceClient.findPublicById(userId);

    if (type === 'SUPERLIKE') {
      const planDetails = getSubscriptionPlanDetails(currentUser.plan);
      const limit = planDetails.superLikesPerDay;

      if (limit !== null) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const usedSuperLikes =
          await this.interactionsRepository.countSentTypeSince(
            userId,
            'SUPERLIKE',
            startOfDay,
          );

        if (usedSuperLikes >= limit) {
          throw new ForbiddenException(
            `Tu plan ${currentUser.plan} ya alcanzo el limite diario de superlikes`,
          );
        }
      }
    }

    const interaction = await this.interactionsRepository.createOrUpdate(
      userId,
      createInteractionDto,
    );

    let match: InteractionResult['match'] = null;

    if (type === 'LIKE' || type === 'SUPERLIKE') {
      const reverseInteraction =
        await this.interactionsRepository.findReverseInteraction(
          targetUserId,
          userId,
        );

      const isMutualLike =
        reverseInteraction?.type === 'LIKE' ||
        reverseInteraction?.type === 'SUPERLIKE';

      if (isMutualLike) {
        const ensuredMatch = await this.matchesServiceClient.ensurePair(
          userId,
          targetUserId,
        );

        match = {
          id: ensuredMatch.id,
          createdAt: ensuredMatch.createdAt,
          matchedUser: await this.usersServiceClient.findPublicById(targetUserId),
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
}
