import { Injectable } from '@nestjs/common';

import type { InteractionRecord } from '../../domain/entities/interaction-record';
import { InteractionsRepository } from '../../domain/repositories/interactions.repository';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindSentInteractionsUseCase {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly usersServiceClient: UsersServiceClient,
  ) {}

  async execute(userId: number): Promise<InteractionRecord[]> {
    const interactions = await this.interactionsRepository.findSentByUser(userId);

    return await Promise.all(
      interactions.map(async (interaction) => ({
        id: interaction.id,
        fromUserId: interaction.fromUserId,
        toUserId: interaction.toUserId,
        type: interaction.type,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        targetUser: await this.usersServiceClient.findPublicById(
          interaction.toUserId,
        ),
      })),
    );
  }
}
