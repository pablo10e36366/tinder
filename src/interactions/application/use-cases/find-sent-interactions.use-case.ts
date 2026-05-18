import { Injectable } from '@nestjs/common';
import type { InteractionRecord } from '../../domain/entities/interaction-record';
import { InteractionsRepository } from '../../domain/repositories/interactions.repository';

@Injectable()
export class FindSentInteractionsUseCase {
  constructor(private readonly interactionsRepository: InteractionsRepository) {}

  async execute(userId: number): Promise<InteractionRecord[]> {
    return await this.interactionsRepository.findSentByUser(userId);
  }
}
