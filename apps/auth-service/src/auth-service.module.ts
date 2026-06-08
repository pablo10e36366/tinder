import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient as AuthPrismaClient,
  RoleCode,
} from '../../../prisma/services/auth/generated/client/index';
import {
  AUTHENTICATED_ROLES,
  CurrentUser,
  Public,
  Roles,
  type AppRole,
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

interface UpdateUserRolesDto {
  roles: AppRole[];
}

const RBAC_ROLE_SEED: Array<{
  code: RoleCode;
  name: string;
  description: string;
}> = [
  { code: RoleCode.USER, name: 'Usuario', description: 'Acceso base autenticado' },
  { code: RoleCode.GOLD, name: 'Gold', description: 'Usuario con beneficios Gold' },
  {
    code: RoleCode.PREMIUM,
    name: 'Premium',
    description: 'Usuario con beneficios Premium',
  },
  { code: RoleCode.ADMIN, name: 'Administrador', description: 'Gestion global del sistema' },
];

const RBAC_PERMISSION_SEED = [
  { code: 'users:read:self', description: 'Leer perfil propio' },
  { code: 'users:update:self', description: 'Actualizar perfil propio' },
  { code: 'interactions:create', description: 'Crear interacciones' },
  { code: 'interactions:read:self', description: 'Listar interacciones propias' },
  { code: 'matches:read:self', description: 'Listar matches propios' },
  { code: 'messages:create', description: 'Enviar mensajes' },
  { code: 'messages:read:self', description: 'Leer mensajes propios' },
  { code: 'subscriptions:read:self', description: 'Leer suscripcion propia' },
  { code: 'subscriptions:update:self', description: 'Actualizar suscripcion propia' },
  { code: 'admin:users:read', description: 'Listar usuarios con acceso RBAC' },
  { code: 'admin:roles:assign', description: 'Asignar roles a usuarios' },
] as const;

const ROLE_PERMISSIONS: Record<RoleCode, readonly string[]> = {
  [RoleCode.USER]: [
    'users:read:self',
    'users:update:self',
    'interactions:create',
    'interactions:read:self',
    'matches:read:self',
    'messages:create',
    'messages:read:self',
    'subscriptions:read:self',
    'subscriptions:update:self',
  ],
  [RoleCode.GOLD]: [
    'users:read:self',
    'users:update:self',
    'interactions:create',
    'interactions:read:self',
    'matches:read:self',
    'messages:create',
    'messages:read:self',
    'subscriptions:read:self',
    'subscriptions:update:self',
  ],
  [RoleCode.PREMIUM]: [
    'users:read:self',
    'users:update:self',
    'interactions:create',
    'interactions:read:self',
    'matches:read:self',
    'messages:create',
    'messages:read:self',
    'subscriptions:read:self',
    'subscriptions:update:self',
  ],
  [RoleCode.ADMIN]: RBAC_PERMISSION_SEED.map((permission) => permission.code),
};

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
class AuthAppService implements OnModuleInit {
  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly usersClient: UsersInternalClient,
    private readonly jwtService: JwtService,
    @Inject(PasswordHasherPort)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async onModuleInit() {
    await this.ensureRbacSeeded();
  }

  private async ensureRbacSeeded() {
    for (const role of RBAC_ROLE_SEED) {
      await this.prisma.role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
        },
        create: role,
      });
    }

    for (const permission of RBAC_PERMISSION_SEED) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          description: permission.description,
        },
        create: permission,
      });
    }

    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany(),
      this.prisma.permission.findMany(),
    ]);

    const roleIdByCode = new Map(roles.map((role) => [role.code, role.id]));
    const permissionIdByCode = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    );

    for (const role of RBAC_ROLE_SEED) {
      const roleId = roleIdByCode.get(role.code);

      if (!roleId) {
        continue;
      }

      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      await this.prisma.rolePermission.createMany({
        data: ROLE_PERMISSIONS[role.code]
          .map((permissionCode) => permissionIdByCode.get(permissionCode))
          .filter((permissionId): permissionId is number => permissionId !== undefined)
          .map((permissionId) => ({
            roleId,
            permissionId,
          })),
        skipDuplicates: true,
      });
    }
  }

  private async getUserRoles(userId: number): Promise<AppRole[]> {
    const assignments = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        roleId: 'asc',
      },
    });

    return assignments.map((assignment) => assignment.role.code as AppRole);
  }

  private async assignRoles(userId: number, roles: RoleCode[]) {
    const uniqueRoles = [...new Set(roles)];

    if (uniqueRoles.length === 0) {
      throw new BadRequestException('Debes asignar al menos un rol');
    }

    const persistedRoles = await this.prisma.role.findMany({
      where: {
        code: {
          in: uniqueRoles,
        },
      },
    });

    if (persistedRoles.length !== uniqueRoles.length) {
      throw new BadRequestException('Uno o mas roles no existen');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });

      await tx.userRole.createMany({
        data: persistedRoles.map((role) => ({
          userId,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });
    });
  }

  private async buildAccessProfile(userId: number) {
    const credential = await this.prisma.authCredential.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        isActive: true,
      },
    });

    if (!credential) {
      throw new UnauthorizedException('Credencial no encontrada');
    }

    return {
      userId: credential.userId,
      email: credential.email,
      isActive: credential.isActive,
      roles: await this.getUserRoles(userId),
    };
  }

  async createCredential(dto: CreateCredentialDto) {
    try {
      const passwordHash = await this.passwordHasher.hash(dto.password);

      await this.ensureRbacSeeded();

      return await this.prisma.$transaction(async (tx) => {
        const credential = await tx.authCredential.create({
          data: {
            userId: dto.userId,
            email: dto.email,
            passwordHash,
          },
        });

        const defaultRole = await tx.role.findUnique({
          where: { code: RoleCode.USER },
          select: { id: true },
        });

        if (!defaultRole) {
          throw new BadRequestException('El rol USER no esta configurado');
        }

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: dto.userId,
              roleId: defaultRole.id,
            },
          },
          update: {},
          create: {
            userId: dto.userId,
            roleId: defaultRole.id,
          },
        });

        return credential;
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
      include: {
        assignedRoles: {
          include: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
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

    const roles = credential.assignedRoles.map(
      (assignment) => assignment.role.code as AppRole,
    );
    const payload: JwtPayloadType = {
      sub: credential.userId,
      email: credential.email,
      roles,
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
        roles,
      },
    };
  }

  async profile(user: AuthenticatedUserType) {
    const publicUser = await this.usersClient.findPublicById(user.id);

    return {
      ...publicUser,
      email: user.email,
      roles: user.roles,
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

  async accessProfile(user: AuthenticatedUserType) {
    return this.buildAccessProfile(user.id);
  }

  async listUsersWithAccess() {
    const credentials = await this.prisma.authCredential.findMany({
      orderBy: {
        userId: 'asc',
      },
      select: {
        userId: true,
        email: true,
        isActive: true,
      },
    });

    return await Promise.all(
      credentials.map(async (credential) => ({
        ...credential,
        roles: await this.getUserRoles(credential.userId),
      })),
    );
  }

  async updateUserRoles(userId: number, dto: UpdateUserRolesDto) {
    await this.findEmailByUserId(userId);
    await this.assignRoles(userId, dto.roles as RoleCode[]);

    return this.buildAccessProfile(userId);
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
  @Roles(...AUTHENTICATED_ROLES)
  profile(@CurrentUser() user: AuthenticatedUserType) {
    return this.authAppService.profile(user);
  }

  @Get('auth/access/me')
  @Roles(...AUTHENTICATED_ROLES)
  accessProfile(@CurrentUser() user: AuthenticatedUserType) {
    return this.authAppService.accessProfile(user);
  }

  @Get('auth/access/users')
  @Roles('ADMIN')
  listUsersWithAccess() {
    return this.authAppService.listUsersWithAccess();
  }

  @Patch('auth/access/users/:userId/roles')
  @Roles('ADMIN')
  updateUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.authAppService.updateUserRoles(userId, dto);
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
