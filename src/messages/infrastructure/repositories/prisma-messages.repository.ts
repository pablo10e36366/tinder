import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { publicUserSelect } from '../../../shared/infrastructure/prisma/public-user.select';
import { normalizePublicUser } from '../../../shared/utils/normalize-public-user';
import { CreateMessageDto } from '../../dto/create-message.dto';
import type { Message } from '../../domain/entities/message';
import { MessagesRepository } from '../../domain/repositories/messages.repository';

@Injectable()
export class PrismaMessagesRepository implements MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get messageDelegate() {
    return (this.prisma as PrismaService & {
      message: {
        create: PrismaService['$transaction'] extends never
          ? never
          : typeof this.prisma['match']['create'];
        findMany: PrismaService['$transaction'] extends never
          ? never
          : typeof this.prisma['match']['findMany'];
      };
    }).message;
  }

  async create(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const message = await this.messageDelegate.create({
      data: {
        matchId: createMessageDto.matchId,
        senderId,
        content: createMessageDto.content,
      },
      include: {
        sender: {
          select: publicUserSelect,
        },
      },
    });

    return {
      id: message.id,
      matchId: message.matchId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      sender: normalizePublicUser(message.sender),
    };
  }

  async findByMatchId(matchId: number): Promise<Message[]> {
    const messages = await this.messageDelegate.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: publicUserSelect,
        },
      },
    });

    return messages.map((message) => ({
      id: message.id,
      matchId: message.matchId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      sender: normalizePublicUser(message.sender),
    }));
  }
}
