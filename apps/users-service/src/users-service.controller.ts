import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
  MESSAGE_PATTERNS,
  type SubscriptionPlan,
  UpdateUserRolesDto,
} from '@app/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { FindPublicUserByIdUseCase } from './application/use-cases/find-public-user-by-id.use-case';
import { FindUserAuthByEmailUseCase } from './application/use-cases/find-user-auth-by-email.use-case';
import { UpdateUserPlanUseCase } from './application/use-cases/update-user-plan.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';

type UserIdPayload = {
  id: number;
};

type UserEmailPayload = {
  email: string;
};

type UpdateUserProfilePayload = {
  userId: number;
  profile: UpdateUserProfileDto;
};

type UpdateUserPlanPayload = {
  userId: number;
  plan: SubscriptionPlan;
};

type UpdateUserAccessRolesPayload = {
  userId: number;
  dto: UpdateUserRolesDto;
};

@Controller()
export class UsersServiceController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findPublicUserByIdUseCase: FindPublicUserByIdUseCase,
    private readonly findUserAuthByEmailUseCase: FindUserAuthByEmailUseCase,
    private readonly updateUserPlanUseCase: UpdateUserPlanUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly prismaUsersRepository: PrismaUsersRepository,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.users.ping)
  handlePing(@Payload() payload: Record<string, unknown>) {
    return {
      service: 'users-service',
      status: 'ok',
      received: payload,
    };
  }

  @MessagePattern(MESSAGE_PATTERNS.users.create)
  async create(@Payload() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.users.findAllPublic)
  async findAll() {
    return await this.findAllUsersUseCase.execute();
  }

  @MessagePattern(MESSAGE_PATTERNS.users.findPublicById)
  async findPublicById(@Payload() payload: UserIdPayload) {
    return await this.findPublicUserByIdUseCase.execute(payload.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.users.findAuthByEmail)
  async findAuthByEmail(@Payload() payload: UserEmailPayload) {
    return await this.findUserAuthByEmailUseCase.execute(payload.email);
  }

  @MessagePattern(MESSAGE_PATTERNS.users.findAccessById)
  async findAccessById(@Payload() payload: UserIdPayload) {
    return await this.prismaUsersRepository.findAccessById(payload.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.users.findAllAccess)
  async findAllAccess() {
    return await this.prismaUsersRepository.findAllAccess();
  }

  @MessagePattern(MESSAGE_PATTERNS.users.updateProfile)
  async updateProfile(@Payload() payload: UpdateUserProfilePayload) {
    return await this.updateUserProfileUseCase.execute(
      payload.userId,
      payload.profile,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.users.updatePlan)
  async updatePlan(@Payload() payload: UpdateUserPlanPayload) {
    return await this.updateUserPlanUseCase.execute(payload.userId, payload.plan);
  }

  @MessagePattern(MESSAGE_PATTERNS.users.updateAccessRoles)
  async updateAccessRoles(@Payload() payload: UpdateUserAccessRolesPayload) {
    return await this.prismaUsersRepository.updateAccessRoles(
      payload.userId,
      payload.dto.roles,
    );
  }
}
