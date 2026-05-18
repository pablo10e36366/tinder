import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindAccessibleMatchByIdUseCase } from '../../../matches/application/use-cases/find-accessible-match-by-id.use-case';
import type { Message } from '../../domain/entities/message';
import { MessagesRepository } from '../../domain/repositories/messages.repository';

@Injectable()
export class FindMatchMessagesUseCase {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly findAccessibleMatchByIdUseCase: FindAccessibleMatchByIdUseCase,
  ) {}

  async execute(userId: number, matchId: number): Promise<Message[]> {
    const match = await this.findAccessibleMatchByIdUseCase.execute(
      matchId,
      userId,
    );

    if (!match) {
      throw new NotFoundException('El match no existe');
    }

    const belongsToMatch = match.user1Id === userId || match.user2Id === userId;

    if (!belongsToMatch) {
      throw new ForbiddenException('No puedes ver mensajes de este match');
    }

    return await this.messagesRepository.findByMatchId(matchId);
  }
}
