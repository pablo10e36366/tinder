import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindAccessibleMatchByIdUseCase } from '../../../matches/application/use-cases/find-accessible-match-by-id.use-case';
import { CreateMessageDto } from '../../dto/create-message.dto';
import type { Message } from '../../domain/entities/message';
import { MessagesRepository } from '../../domain/repositories/messages.repository';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly findAccessibleMatchByIdUseCase: FindAccessibleMatchByIdUseCase,
  ) {}

  async execute(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const trimmedContent = createMessageDto.content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('El mensaje no puede estar vacio');
    }

    const match = await this.findAccessibleMatchByIdUseCase.execute(
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

    return await this.messagesRepository.create(senderId, {
      ...createMessageDto,
      content: trimmedContent,
    });
  }
}
