import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AUTHENTICATED_ROLES, Roles } from './decorators/roles.decorator';
import { FindAllUserAccessUseCase } from './application/use-cases/find-all-user-access.use-case';
import { FindMyAccessUseCase } from './application/use-cases/find-my-access.use-case';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UpdateUserRolesUseCase } from './application/use-cases/update-user-roles.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly findMyAccessUseCase: FindMyAccessUseCase,
    private readonly findAllUserAccessUseCase: FindAllUserAccessUseCase,
    private readonly updateUserRolesUseCase: UpdateUserRolesUseCase,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.loginUseCase.execute(loginDto);
  }

  @Get('profile')
  @Roles(...AUTHENTICATED_ROLES)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('access/me')
  @Roles(...AUTHENTICATED_ROLES)
  getMyAccess(@CurrentUser() user: AuthenticatedUser) {
    return this.findMyAccessUseCase.execute(user);
  }

  @Get('access/users')
  @Roles('ADMIN')
  getAllUserAccess() {
    return this.findAllUserAccessUseCase.execute();
  }

  @Patch('access/users/:userId/roles')
  @Roles('ADMIN')
  updateUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    return this.updateUserRolesUseCase.execute(userId, updateUserRolesDto);
  }
}
