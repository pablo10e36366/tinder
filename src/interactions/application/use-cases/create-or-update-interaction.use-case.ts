import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MatchSummary } from '../../../matches/domain/entities/match-summary';
import { EnsureMatchUseCase } from '../../../matches/application/use-cases/ensure-match.use-case';
import { FindPublicUserByIdUseCase } from '../../../users/application/use-cases/find-public-user-by-id.use-case';
import { getSubscriptionPlanDetails } from '../../../subscriptions/domain/services/subscription-plan-policy';
import { CreateInteractionDto } from '../../dto/create-interaction.dto';
import type { InteractionResult } from '../../domain/entities/interaction-result';
import { InteractionsRepository } from '../../domain/repositories/interactions.repository';

@Injectable()
export class CreateOrUpdateInteractionUseCase {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly findPublicUserByIdUseCase: FindPublicUserByIdUseCase,
    private readonly ensureMatchUseCase: EnsureMatchUseCase,
  ) {}

  async execute(
    userId: number,
    createInteractionDto: CreateInteractionDto,
  ): Promise<InteractionResult> {
    const { targetUserId, type } = createInteractionDto;

    if (userId === targetUserId) {
      throw new BadRequestException('No puedes interactuar contigo mismo');
    }

    const targetUser = await this.findPublicUserByIdUseCase.execute(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('El usuario objetivo no existe');
    }

    const currentUser = await this.findPublicUserByIdUseCase.execute(userId);

    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

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

    let match: MatchSummary | null = null;

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
        const ensuredMatch = await this.ensureMatchUseCase.execute(
          userId,
          targetUserId,
        );

        match = {
          id: ensuredMatch.id,
          createdAt: ensuredMatch.createdAt,
          matchedUser:
            ensuredMatch.user1Id === userId
              ? ensuredMatch.secondUser
              : ensuredMatch.firstUser,
        };
      }
    }

    return {
      id: interaction.id,
      type: interaction.type,
      targetUser: interaction.targetUser,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
      isMatch: Boolean(match),
      match,
    };
  }
}
