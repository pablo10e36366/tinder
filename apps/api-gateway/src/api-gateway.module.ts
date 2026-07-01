import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { GatewayJwtStrategy } from './auth/gateway-jwt.strategy';
import { InteractionsController } from './interactions/interactions.controller';
import { MatchesController } from './matches/matches.controller';
import { MessagesController } from './messages/messages.controller';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.AUTH_SERVICE_PORT ?? 3001),
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
      {
        name: 'SUBSCRIPTIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SUBSCRIPTIONS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.SUBSCRIPTIONS_SERVICE_PORT ?? 3003),
        },
      },
      {
        name: 'INTERACTIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.INTERACTIONS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.INTERACTIONS_SERVICE_PORT ?? 3004),
        },
      },
      {
        name: 'MATCHES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MATCHES_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MATCHES_SERVICE_PORT ?? 3005),
        },
      },
      {
        name: 'MESSAGES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MESSAGES_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MESSAGES_SERVICE_PORT ?? 3006),
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    InteractionsController,
    MatchesController,
    MessagesController,
    UsersController,
    SubscriptionsController,
  ],
  providers: [
    GatewayJwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class ApiGatewayModule {}
