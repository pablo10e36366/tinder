import { Module } from '@nestjs/common';
import { SecurityModule } from '@app/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { FindPublicUserByIdUseCase } from './application/use-cases/find-public-user-by-id.use-case';
import { FindUserAuthByEmailUseCase } from './application/use-cases/find-user-auth-by-email.use-case';
import { UpdateUserPlanUseCase } from './application/use-cases/update-user-plan.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';
import { UsersRepository } from './domain/repositories/users.repository';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';
import { UsersServiceController } from './users-service.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [UsersServiceController],
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
})
export class UsersServiceModule {}
