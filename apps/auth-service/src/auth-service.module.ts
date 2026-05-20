import {
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient as AuthPrismaClient,
} from '../../../prisma/services/auth/generated/client';
import {
  CurrentUser,
  Public,
  JwtPayload,
  sharedAuthImports,
  sharedAuthProviders,
} from '../../common/src/auth';
import type {
  AuthenticatedUser as AuthenticatedUserType,
  JwtPayload as JwtPayloadType,
} from '../../common/src/auth';
import { requestJson } from '../../common/src/http';
import { SecurityModule } from '../../../src/shared/infrastructure/security/security.module';
import { PasswordHasherPort } from '../../../src/shared/application/ports/password-hasher.port';
import { Inject } from '@nestjs/common';
import { LoginDto } from '../../../src/auth/dto/login.dto';

interface CreateCredentialDto {
  userId: number;
  email: string;
  password: string;
}

interface UserProfileResponse {
  id: number;
  name: string;
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}

@Injectable()
class AuthPrismaService extends AuthPrismaClient {
  constructor() {
    const connectionString = process.env.AUTH_DATABASE_URL;

    if (!connectionString) {
      throw new Error('AUTH_DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }
}

@Injectable()
class UsersInternalClient {
  private readonly baseUrl =
    process.env.USERS_SERVICE_URL ?? 'http://localhost:3002';

  async findPublicById(userId: number): Promise<UserProfileResponse> {
    return await requestJson<UserProfileResponse>(
      `${this.baseUrl}/users/internal/public/${userId}`,
    );
  }
}

@Injectable()
class AuthAppService {
  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly usersClient: UsersInternalClient,
    private readonly jwtService: JwtService,
    @Inject(PasswordHasherPort)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async createCredential(dto: CreateCredentialDto) {
    try {
      const passwordHash = await this.passwordHasher.hash(dto.password);

      return await this.prisma.authCredential.create({
        data: {
          userId: dto.userId,
          email: dto.email,
          passwordHash,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya esta registrado');
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const credential = await this.prisma.authCredential.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!credential || !credential.isActive) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await this.passwordHasher.compare(
      loginDto.password,
      credential.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload: JwtPayloadType = {
      sub: credential.userId,
      email: credential.email,
    };

    const [accessToken, publicUser] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.usersClient.findPublicById(credential.userId),
    ]);

    return {
      access_token: accessToken,
      user: {
        ...publicUser,
        email: credential.email,
      },
    };
  }

  async profile(user: AuthenticatedUserType) {
    const publicUser = await this.usersClient.findPublicById(user.id);

    return {
      ...publicUser,
      email: user.email,
    };
  }

  async findEmailByUserId(userId: number) {
    const credential = await this.prisma.authCredential.findUnique({
      where: {
        userId,
      },
      select: {
        email: true,
      },
    });

    if (!credential) {
      throw new UnauthorizedException('Credencial no encontrada');
    }

    return credential;
  }
}

@Controller()
class AuthServiceController {
  constructor(private readonly authAppService: AuthAppService) {}

  @Public()
  @Post('auth/login')
  login(@Body() loginDto: LoginDto) {
    return this.authAppService.login(loginDto);
  }

  @Get('auth/profile')
  profile(@CurrentUser() user: AuthenticatedUserType) {
    return this.authAppService.profile(user);
  }

  @Public()
  @Post('internal/credentials')
  createCredential(@Body() createCredentialDto: CreateCredentialDto) {
    return this.authAppService.createCredential(createCredentialDto);
  }

  @Public()
  @Get('internal/users/:userId/email')
  findEmailByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.authAppService.findEmailByUserId(userId);
  }
}

@Module({
  imports: [
    SecurityModule,
    ...sharedAuthImports,
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
  controllers: [AuthServiceController],
  providers: [
    AuthPrismaService,
    UsersInternalClient,
    AuthAppService,
    ...sharedAuthProviders,
  ],
})
export class AuthServiceModule {}
