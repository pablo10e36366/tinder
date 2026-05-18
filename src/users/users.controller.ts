import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { FindPublicUserByIdUseCase } from './application/use-cases/find-public-user-by-id.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findPublicUserByIdUseCase: FindPublicUserByIdUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.createUserUseCase.execute(createUserDto);
  }

  @Get()
  findAll() {
    return this.findAllUsersUseCase.execute();
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.findPublicUserByIdUseCase.execute(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.updateUserProfileUseCase.execute(user.id, updateUserProfileDto);
  }
}
