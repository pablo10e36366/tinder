import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { SecurityModule } from '../shared/infrastructure/security/security.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';
import { TokenSignerPort } from './domain/ports/token-signer.port';
import { FindAllUserAccessUseCase } from './application/use-cases/find-all-user-access.use-case';
import { FindMyAccessUseCase } from './application/use-cases/find-my-access.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UpdateUserRolesUseCase } from './application/use-cases/update-user-roles.use-case';
import { ValidateJwtUserUseCase } from './application/use-cases/validate-jwt-user.use-case';
import { JwtTokenSignerAdapter } from './infrastructure/adapters/jwt-token-signer.adapter';

@Module({
  imports: [
    UsersModule,
    SecurityModule,
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
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    FindMyAccessUseCase,
    FindAllUserAccessUseCase,
    UpdateUserRolesUseCase,
    ValidateJwtUserUseCase,
    JwtStrategy,
    JwtTokenSignerAdapter,
    {
      provide: TokenSignerPort,
      useExisting: JwtTokenSignerAdapter,
    },
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
export class AuthModule {}
