import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateMessageDto } from '../../dto/create-message.dto';
import type { Message } from '../../domain/entities/message';
import { MessagesRepository } from '../../domain/repositories/messages.repository';
import { MatchesServiceClient } from '../../infrastructure/clients/matches-service.client';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly matchesServiceClient: MatchesServiceClient,
    private readonly usersServiceClient: UsersServiceClient,
  ) {}

  async execute(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const trimmedContent = createMessageDto.content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('El mensaje no puede estar vacio');
    }

    const match = await this.matchesServiceClient.findAccessibleById(
      createMessageDto.matchId,
      senderId,
    );

    if (!match) {
      throw new NotFoundException('El match no existe');
    }

    const belongsToMatch =
      match.user1Id === senderId || match.user2Id === senderId;

    if (!belongsToMatch) {
      throw new ForbiddenException('No puedes enviar mensajes en este match');
    }

    const message = await this.messagesRepository.create(senderId, {
      ...createMessageDto,
      content: trimmedContent,
    });

    return {
      ...message,
      sender: await this.usersServiceClient.findPublicById(message.senderId),
    };
  }
}
