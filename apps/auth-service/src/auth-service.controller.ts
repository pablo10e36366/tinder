import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
  LoginDto,
  MESSAGE_PATTERNS,
  UpdateUserRolesDto,
  type AuthenticatedUser,
  type JwtPayload,
} from '@app/common';
import { FindAllUserAccessUseCase } from './application/use-cases/find-all-user-access.use-case';
import { FindMyAccessUseCase } from './application/use-cases/find-my-access.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UpdateUserRolesUseCase } from './application/use-cases/update-user-roles.use-case';
import { ValidateJwtUserUseCase } from './application/use-cases/validate-jwt-user.use-case';

type AuthenticatedUserPayload = {
  user: AuthenticatedUser;
};

type UpdateUserRolesPayload = {
  userId: number;
  dto: UpdateUserRolesDto;
};

@Controller()
export class AuthServiceController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly validateJwtUserUseCase: ValidateJwtUserUseCase,
    private readonly findMyAccessUseCase: FindMyAccessUseCase,
    private readonly findAllUserAccessUseCase: FindAllUserAccessUseCase,
    private readonly updateUserRolesUseCase: UpdateUserRolesUseCase,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.auth.login)
  async login(@Payload() loginDto: LoginDto) {
    return await this.loginUseCase.execute(loginDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.validateToken)
  async validateToken(@Payload() payload: JwtPayload) {
    return await this.validateJwtUserUseCase.execute(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.getMyAccess)
  async getMyAccess(@Payload() payload: AuthenticatedUserPayload) {
    return await this.findMyAccessUseCase.execute(payload.user);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.listUserAccess)
  async listUserAccess() {
    return await this.findAllUserAccessUseCase.execute();
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.updateUserRoles)
  async updateUserRoles(@Payload() payload: UpdateUserRolesPayload) {
    return await this.updateUserRolesUseCase.execute(payload.userId, payload.dto);
  }
}
