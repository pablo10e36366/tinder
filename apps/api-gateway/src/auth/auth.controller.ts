import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  LoginDto,
  MESSAGE_PATTERNS,
  UpdateUserRolesDto,
  type AuthenticatedUser,
} from '@app/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AUTHENTICATED_ROLES, Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await firstValueFrom(
      this.authClient.send(MESSAGE_PATTERNS.auth.login, loginDto),
    );
  }

  @Get('profile')
  @Roles(...AUTHENTICATED_ROLES)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('access/me')
  @Roles(...AUTHENTICATED_ROLES)
  async getMyAccess(@CurrentUser() user: AuthenticatedUser) {
    return await firstValueFrom(
      this.authClient.send(MESSAGE_PATTERNS.auth.getMyAccess, { user }),
    );
  }

  @Get('access/users')
  @Roles('ADMIN')
  async getAllUserAccess() {
    return await firstValueFrom(
      this.authClient.send(MESSAGE_PATTERNS.auth.listUserAccess, {}),
    );
  }

  @Patch('access/users/:userId/roles')
  @Roles('ADMIN')
  async updateUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    return await firstValueFrom(
      this.authClient.send(MESSAGE_PATTERNS.auth.updateUserRoles, {
        userId,
        dto: updateUserRolesDto,
      }),
    );
  }
}
