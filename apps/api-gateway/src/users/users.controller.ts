import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  CreateUserDto,
  MESSAGE_PATTERNS,
  type AuthenticatedUser,
  UpdateUserProfileDto,
} from '@app/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.create, createUserDto),
    );
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findAllPublic, {}),
    );
  }

  @Get('me')
  @Roles(...AUTHENTICATED_ROLES)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findPublicById, { id: user.id }),
    );
  }

  @Patch('me')
  @Roles(...AUTHENTICATED_ROLES)
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.updateProfile, {
        userId: user.id,
        profile: updateUserProfileDto,
      }),
    );
  }

  @Public()
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.findPublicById, { id }),
    );
  }

  @Public()
  @Patch(':id/profile')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return await firstValueFrom(
      this.usersClient.send(MESSAGE_PATTERNS.users.updateProfile, {
        userId: id,
        profile: updateUserProfileDto,
      }),
    );
  }
}
