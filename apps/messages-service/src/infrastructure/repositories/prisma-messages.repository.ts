import { Injectable } from '@nestjs/common';

import { CreateMessageDto } from '../../dto/create-message.dto';
import {
  MessagesRepository,
  type StoredMessage,
} from '../../domain/repositories/messages.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaMessagesRepository implements MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get messageDelegate() {
    return this.prisma.message;
  }

  async create(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<StoredMessage> {
    return await this.messageDelegate.create({
      data: {
        matchId: createMessageDto.matchId,
        senderId,
        content: createMessageDto.content,
      },
    });
  }

  async findByMatchId(matchId: number): Promise<StoredMessage[]> {
    return await this.messageDelegate.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
