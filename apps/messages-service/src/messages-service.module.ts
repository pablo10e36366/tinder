import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { FindMatchMessagesUseCase } from './application/use-cases/find-match-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { MessagesRepository } from './domain/repositories/messages.repository';
import { MatchesServiceClient } from './infrastructure/clients/matches-service.client';
import { UsersServiceClient } from './infrastructure/clients/users-service.client';
import { PrismaMessagesRepository } from './infrastructure/repositories/prisma-messages.repository';
import { MessagesServiceController } from './messages-service.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'MATCHES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MATCHES_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MATCHES_SERVICE_PORT ?? 3005),
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USERS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.USERS_SERVICE_PORT ?? 3002),
        },
      },
    ]),
  ],
  controllers: [MessagesServiceController],
  providers: [
    SendMessageUseCase,
    FindMatchMessagesUseCase,
    MatchesServiceClient,
    UsersServiceClient,
    PrismaMessagesRepository,
    {
      provide: MessagesRepository,
      useExisting: PrismaMessagesRepository,
    },
  ],
})
export class MessagesServiceModule {}
