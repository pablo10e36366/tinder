import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthServiceController } from './auth-service.controller';
import { SecurityModule } from '@app/common';
import { FindAllUserAccessUseCase } from './application/use-cases/find-all-user-access.use-case';
import { FindMyAccessUseCase } from './application/use-cases/find-my-access.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UpdateUserRolesUseCase } from './application/use-cases/update-user-roles.use-case';
import { ValidateJwtUserUseCase } from './application/use-cases/validate-jwt-user.use-case';
import { TokenSignerPort } from './domain/ports/token-signer.port';
import { JwtTokenSignerAdapter } from './infrastructure/adapters/jwt-token-signer.adapter';
import { UsersServiceClient } from './infrastructure/clients/users-service.client';

@Module({
  imports: [
    SecurityModule,
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USERS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.USERS_SERVICE_PORT ?? 3002),
        },
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        return {
          secret,
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
    }),
  ],
  controllers: [AuthServiceController],
  providers: [
    LoginUseCase,
    FindMyAccessUseCase,
    FindAllUserAccessUseCase,
    UpdateUserRolesUseCase,
    ValidateJwtUserUseCase,
    UsersServiceClient,
    JwtTokenSignerAdapter,
    {
      provide: TokenSignerPort,
      useExisting: JwtTokenSignerAdapter,
    },
  ],
})
export class AuthServiceModule {}
