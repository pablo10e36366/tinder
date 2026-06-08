import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient as MessagesPrismaClient,
} from '../../../prisma/services/messages/generated/client';
import {
  AUTHENTICATED_ROLES,
  CurrentUser,
  Roles,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type { AuthenticatedUser as AuthenticatedUserType } from '../../common/src/auth';
import { requestJson } from '../../common/src/http';
import { CreateMessageDto } from '../../../src/messages/dto/create-message.dto';

interface AccessibleMatchResponse {
  id: number;
  userAId: number;
  userBId: number;
}

@Injectable()
class MessagesPrismaService extends MessagesPrismaClient {
  constructor() {
    const connectionString = process.env.MESSAGES_DATABASE_URL;

    if (!connectionString) {
      throw new Error('MESSAGES_DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }
}

@Injectable()
class MatchesInternalClient {
  private readonly baseUrl =
    process.env.MATCHES_SERVICE_URL ?? 'http://localhost:3005';

  async findAccessibleMatch(
    matchId: number,
    userId: number,
  ): Promise<AccessibleMatchResponse> {
    return await requestJson<AccessibleMatchResponse>(
      `${this.baseUrl}/internal/matches/${matchId}/access/${userId}`,
    );
  }
}

@Injectable()
class MessagesAppService {
  constructor(
    private readonly prisma: MessagesPrismaService,
    private readonly matchesClient: MatchesInternalClient,
  ) {}

  private async findOrCreateConversation(matchId: number, userId: number) {
    const match = await this.matchesClient.findAccessibleMatch(matchId, userId);

    const existingConversation = await this.prisma.conversation.findUnique({
      where: {
        sourceMatchId: matchId,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    return await this.prisma.conversation.create({
      data: {
        sourceMatchId: match.id,
        userAId: match.userAId,
        userBId: match.userBId,
      },
    });
  }

  async create(userId: number, dto: CreateMessageDto) {
    const trimmedContent = dto.content?.trim();

    if (!trimmedContent) {
      throw new BadRequestException('El mensaje no puede estar vacio');
    }

    const conversation = await this.findOrCreateConversation(dto.matchId, userId);
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: userId,
        content: trimmedContent,
      },
    });

    return {
      id: message.id,
      matchId: dto.matchId,
      senderId: userId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  async findByMatch(userId: number, matchId: number) {
    const conversation = await this.findOrCreateConversation(matchId, userId);
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((message) => ({
      id: message.id,
      matchId,
      senderId: message.senderUserId,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }
}

@Controller('messages')
class MessagesServiceController {
  constructor(private readonly messagesAppService: MessagesAppService) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  create(
    @CurrentUser() user: AuthenticatedUserType,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesAppService.create(user.id, createMessageDto);
  }

  @Get(':matchId')
  @Roles(...AUTHENTICATED_ROLES)
  findByMatch(
    @CurrentUser() user: AuthenticatedUserType,
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return this.messagesAppService.findByMatch(user.id, matchId);
  }
}

@Module({
  imports: [...sharedAuthImports],
  controllers: [MessagesServiceController],
  providers: [
    MessagesPrismaService,
    MatchesInternalClient,
    MessagesAppService,
    ...sharedAuthProviders,
  ],
})
export class MessagesServiceModule {}
