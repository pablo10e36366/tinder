import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient as UsersPrismaClient,
  AccountStatus,
} from '../../../prisma/services/users/generated/client';
import {
  AUTHENTICATED_ROLES,
  AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type { AuthenticatedUser as AuthenticatedUserType } from '../../common/src/auth';
import { requestJson } from '../../common/src/http';
import { CreateUserDto } from '../../../src/users/dto/create-user.dto';
import { UpdateUserProfileDto } from '../../../src/users/dto/update-user-profile.dto';

type UserWithRelations = Awaited<ReturnType<UsersAppService['findUserOrFail']>>;

interface UserProfileResponse {
  id: number;
  name: string;
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}

interface UserAggregateResponse extends UserProfileResponse {
  email: string;
  plan: string;
}

@Injectable()
class UsersPrismaService extends UsersPrismaClient {
  constructor() {
    const connectionString = process.env.USERS_DATABASE_URL;

    if (!connectionString) {
      throw new Error('USERS_DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }
}

@Injectable()
class AuthInternalClient {
  private readonly baseUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

  async createCredential(
    userId: number,
    email: string,
    password: string,
  ): Promise<void> {
    await requestJson<void>(`${this.baseUrl}/internal/credentials`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        email,
        password,
      }),
    });
  }

  async findEmailByUserId(userId: number): Promise<string> {
    const response = await requestJson<{ email: string }>(
      `${this.baseUrl}/internal/users/${userId}/email`,
    );

    return response.email;
  }
}

@Injectable()
class SubscriptionsInternalClient {
  private readonly baseUrl =
    process.env.SUBSCRIPTIONS_SERVICE_URL ?? 'http://localhost:3003';

  async ensureDefaultPlan(userId: number): Promise<void> {
    await requestJson<void>(
      `${this.baseUrl}/internal/users/${userId}/ensure-default`,
      {
        method: 'POST',
      },
    );
  }

  async findCurrentPlan(userId: number): Promise<string> {
    const response = await requestJson<{ plan: string }>(
      `${this.baseUrl}/internal/users/${userId}/current`,
    );

    return response.plan;
  }
}

@Injectable()
class UsersAppService {
  constructor(
    private readonly prisma: UsersPrismaService,
    private readonly authClient: AuthInternalClient,
    private readonly subscriptionsClient: SubscriptionsInternalClient,
  ) {}

  private async buildPublicUser(user: UserWithRelations): Promise<UserProfileResponse> {
    return {
      id: user.id,
      name: user.displayName,
      age: user.profile?.age ?? null,
      bio: user.profile?.bio ?? null,
      interests: user.interests.map((interest) => interest.interest),
      location: user.profile?.location ?? null,
      photos: user.photos
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => photo.url),
    };
  }

  private async buildAggregateUser(
    user: UserWithRelations,
  ): Promise<UserAggregateResponse> {
    const [email, plan, publicUser] = await Promise.all([
      this.authClient.findEmailByUserId(user.id),
      this.subscriptionsClient.findCurrentPlan(user.id),
      this.buildPublicUser(user),
    ]);

    return {
      ...publicUser,
      email,
      plan,
    };
  }

  async findUserOrFail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        photos: true,
        interests: true,
      },
    });

    if (!user || user.accountStatus === AccountStatus.DELETED) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserAggregateResponse> {
    const user = await this.prisma.user.create({
      data: {
        displayName: createUserDto.name,
      },
      include: {
        profile: true,
        photos: true,
        interests: true,
      },
    });

    try {
      await this.authClient.createCredential(
        user.id,
        createUserDto.email,
        createUserDto.password,
      );
      await this.subscriptionsClient.ensureDefaultPlan(user.id);
    } catch (error) {
      await this.prisma.user.delete({
        where: { id: user.id },
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new ConflictException('No se pudo completar el registro');
    }

    return await this.buildAggregateUser(user);
  }

  async findAll(): Promise<UserAggregateResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        accountStatus: {
          not: AccountStatus.DELETED,
        },
      },
      include: {
        profile: true,
        photos: true,
        interests: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return await Promise.all(users.map((user) => this.buildAggregateUser(user)));
  }

  async findMe(userId: number): Promise<UserAggregateResponse> {
    return await this.buildAggregateUser(await this.findUserOrFail(userId));
  }

  async updateMe(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserAggregateResponse> {
    await this.prisma.$transaction(async (tx) => {
      if (
        updateUserProfileDto.age !== undefined ||
        updateUserProfileDto.bio !== undefined ||
        updateUserProfileDto.location !== undefined
      ) {
        await tx.userProfile.upsert({
          where: {
            userId,
          },
          create: {
            userId,
            age: updateUserProfileDto.age,
            bio: updateUserProfileDto.bio,
            location: updateUserProfileDto.location,
          },
          update: {
            age: updateUserProfileDto.age,
            bio: updateUserProfileDto.bio,
            location: updateUserProfileDto.location,
          },
        });
      }

      if (updateUserProfileDto.photos) {
        await tx.userPhoto.deleteMany({
          where: { userId },
        });

        if (updateUserProfileDto.photos.length > 0) {
          await tx.userPhoto.createMany({
            data: updateUserProfileDto.photos.map((url, index) => ({
              userId,
              url,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          });
        }
      }

      if (updateUserProfileDto.interests) {
        await tx.userInterest.deleteMany({
          where: { userId },
        });

        if (updateUserProfileDto.interests.length > 0) {
          await tx.userInterest.createMany({
            data: updateUserProfileDto.interests.map((interest) => ({
              userId,
              interest,
            })),
          });
        }
      }
    });

    return await this.findMe(userId);
  }

  async findPublicById(userId: number): Promise<UserProfileResponse> {
    return await this.buildPublicUser(await this.findUserOrFail(userId));
  }
}

@Controller('users')
class UsersServiceController {
  constructor(private readonly usersAppService: UsersAppService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersAppService.create(createUserDto);
  }

  @Get()
  @Roles(...AUTHENTICATED_ROLES)
  findAll() {
    return this.usersAppService.findAll();
  }

  @Get('me')
  @Roles(...AUTHENTICATED_ROLES)
  findMe(@CurrentUser() user: AuthenticatedUserType) {
    return this.usersAppService.findMe(user.id);
  }

  @Patch('me')
  @Roles(...AUTHENTICATED_ROLES)
  updateMe(
    @CurrentUser() user: AuthenticatedUserType,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.usersAppService.updateMe(user.id, updateUserProfileDto);
  }

  @Public()
  @Get('internal/public/:id')
  findPublicById(@Param('id', ParseIntPipe) userId: number) {
    return this.usersAppService.findPublicById(userId);
  }
}

@Module({
  imports: [...sharedAuthImports],
  controllers: [UsersServiceController],
  providers: [
    UsersPrismaService,
    AuthInternalClient,
    SubscriptionsInternalClient,
    UsersAppService,
    ...sharedAuthProviders,
  ],
})
export class UsersServiceModule {}
