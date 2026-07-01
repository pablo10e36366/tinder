import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Message } from '../../domain/entities/message';
import { MessagesRepository } from '../../domain/repositories/messages.repository';
import { MatchesServiceClient } from '../../infrastructure/clients/matches-service.client';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindMatchMessagesUseCase {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly matchesServiceClient: MatchesServiceClient,
    private readonly usersServiceClient: UsersServiceClient,
  ) {}

  async execute(userId: number, matchId: number): Promise<Message[]> {
    const match = await this.matchesServiceClient.findAccessibleById(
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

    const messages = await this.messagesRepository.findByMatchId(matchId);

    return await Promise.all(
      messages.map(async (message) => ({
        ...message,
        sender: await this.usersServiceClient.findPublicById(message.senderId),
      })),
    );
  }
}
