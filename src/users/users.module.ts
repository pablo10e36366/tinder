import { Module } from '@nestjs/common';
import { SecurityModule } from '../shared/infrastructure/security/security.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { FindPublicUserByIdUseCase } from './application/use-cases/find-public-user-by-id.use-case';
import { FindUserAuthByEmailUseCase } from './application/use-cases/find-user-auth-by-email.use-case';
import { UpdateUserPlanUseCase } from './application/use-cases/update-user-plan.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';
import { UsersRepository } from './domain/repositories/users.repository';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindPublicUserByIdUseCase,
    FindUserAuthByEmailUseCase,
    UpdateUserPlanUseCase,
    UpdateUserProfileUseCase,
    PrismaUsersRepository,
    {
      provide: UsersRepository,
      useExisting: PrismaUsersRepository,
    },
  ],
  exports: [
    UsersRepository,
    FindPublicUserByIdUseCase,
    FindUserAuthByEmailUseCase,
    UpdateUserPlanUseCase,
    UpdateUserProfileUseCase,
  ],
})
export class UsersModule {}
