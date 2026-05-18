import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FindMatchMessagesUseCase } from './application/use-cases/find-match-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { MessagesRepository } from './domain/repositories/messages.repository';
import { PrismaMessagesRepository } from './infrastructure/repositories/prisma-messages.repository';
import { MessagesController } from './messages.controller';

@Module({
  imports: [PrismaModule, MatchesModule],
  controllers: [MessagesController],
  providers: [
    SendMessageUseCase,
    FindMatchMessagesUseCase,
    PrismaMessagesRepository,
    {
      provide: MessagesRepository,
      useExisting: PrismaMessagesRepository,
    },
  ],
})
export class MessagesModule {}
