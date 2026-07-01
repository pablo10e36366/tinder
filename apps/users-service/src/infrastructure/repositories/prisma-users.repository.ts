import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  AppRole,
  SubscriptionPlan,
  UserAccess,
} from '@app/common';
import { getSubscriptionPlanDetails } from '@app/common';
import {
  Prisma,
  RoleCode,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '../../../prisma/generated/client';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserProfileDto } from '../../dto/update-user-profile.dto';
import type { PublicUser } from '../../domain/entities/public-user';
import type { UserAuthRecord } from '../../domain/entities/user-auth-record';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { publicUserSelect } from '../prisma/public-user.select';
import { normalizePublicUser } from '../prisma/normalize-public-user';
import { PrismaService } from '../../prisma/prisma.service';

type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureRole(
    tx: PrismaTransaction,
    code: RoleCode,
  ): Promise<{ id: number; code: RoleCode }> {
    return await tx.role.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code,
        description: `Rol ${code} del sistema`,
      },
      select: {
        id: true,
        code: true,
      },
    });
  }

  private async ensurePlan(
    tx: PrismaTransaction,
    code: SubscriptionPlan,
  ): Promise<{ id: number; code: SubscriptionPlanCode }> {
    const details = getSubscriptionPlanDetails(code);

    return await tx.subscriptionPlan.upsert({
      where: { code: code as SubscriptionPlanCode },
      update: {
        name: details.name,
        description: details.description,
        superLikesPerDay: details.superLikesPerDay,
      },
      create: {
        code: code as SubscriptionPlanCode,
        name: details.name,
        description: details.description,
        superLikesPerDay: details.superLikesPerDay,
      },
      select: {
        id: true,
        code: true,
      },
    });
  }

  private async syncRolesForPlan(
    tx: PrismaTransaction,
    userId: number,
    plan: SubscriptionPlan,
  ): Promise<void> {
    const userRole = await this.ensureRole(tx, RoleCode.USER);

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: userRole.id,
      },
    });

    await tx.userRole.deleteMany({
      where: {
        userId,
        role: {
          code: {
            in: [RoleCode.GOLD, RoleCode.PREMIUM],
          },
        },
      },
    });

    const planRoleCode =
      plan === 'GOLD'
        ? RoleCode.GOLD
        : plan === 'PREMIUM'
          ? RoleCode.PREMIUM
          : null;

    if (!planRoleCode) {
      return;
    }

    const planRole = await this.ensureRole(tx, planRoleCode);

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: planRole.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: planRole.id,
      },
    });
  }

  private async buildUserAccess(userId: number): Promise<UserAccess> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
          orderBy: {
            role: {
              code: 'asc',
            },
          },
        },
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
          },
          take: 1,
          orderBy: {
            startedAt: 'desc',
          },
          select: {
            plan: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.profile?.displayName ?? user.email,
      email: user.email,
      plan: (user.subscriptions[0]?.plan.code ?? 'FREE') as UserAccess['plan'],
      roles: user.userRoles.map((userRole) => userRole.role.code as AppRole),
    };
  }

  private async findPublicUserOrThrow(userId: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return normalizePublicUser(user);
  }

  async create(
    createUserDto: CreateUserDto,
    hashedPassword: string,
  ): Promise<PublicUser> {
    const userId = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createUserDto.email,
          passwordHash: hashedPassword,
          profile: {
            create: {
              displayName: createUserDto.name,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const freePlan = await this.ensurePlan(tx, 'FREE');

      await tx.userSubscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await this.syncRolesForPlan(tx, user.id, 'FREE');

      return user.id;
    });

    return await this.findPublicUserOrThrow(userId);
  }

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        profile: {
          select: {
            displayName: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.profile?.displayName ?? user.email,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.userRoles.map((userRole) => userRole.role.code as AppRole),
    };
  }

  async findAccessById(id: number): Promise<UserAccess | null> {
    try {
      return await this.buildUserAccess(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  async findAllAccess(): Promise<UserAccess[]> {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    return await Promise.all(users.map((user) => this.buildUserAccess(user.id)));
  }

  async findPublicById(id: number): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    return user ? normalizePublicUser(user) : null;
  }

  async findAllPublic(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users.map((user) => normalizePublicUser(user));
  }

  async updateProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<PublicUser> {
    await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const shouldTouchProfile =
        updateUserProfileDto.age !== undefined ||
        updateUserProfileDto.bio !== undefined ||
        updateUserProfileDto.location !== undefined;

      if (shouldTouchProfile) {
        await tx.userProfile.upsert({
          where: { userId },
          update: {
            age: updateUserProfileDto.age,
            bio: updateUserProfileDto.bio,
            location: updateUserProfileDto.location,
          },
          create: {
            userId,
            displayName:
              existingUser.profile?.displayName ?? existingUser.email,
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

    return await this.findPublicUserOrThrow(userId);
  }

  async updatePlan(userId: number, plan: SubscriptionPlan): Promise<PublicUser> {
    await this.prisma.$transaction(async (tx) => {
      const planRecord = await this.ensurePlan(tx, plan);

      await tx.userSubscription.updateMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      await tx.userSubscription.create({
        data: {
          userId,
          planId: planRecord.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await this.syncRolesForPlan(tx, userId, plan);
    });

    return await this.findPublicUserOrThrow(userId);
  }

  async updateAccessRoles(userId: number, roles: AppRole[]): Promise<UserAccess> {
    const normalizedRoles = Array.from(new Set(['USER', ...roles])) as AppRole[];
    const targetPlan: SubscriptionPlan = normalizedRoles.includes('PREMIUM')
      ? 'PREMIUM'
      : normalizedRoles.includes('GOLD')
        ? 'GOLD'
        : 'FREE';

    await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const planRecord = await this.ensurePlan(tx, targetPlan);

      await tx.userSubscription.updateMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      await tx.userSubscription.create({
        data: {
          userId,
          planId: planRecord.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await this.syncRolesForPlan(tx, userId, targetPlan);

      const adminRole = await this.ensureRole(tx, RoleCode.ADMIN);

      if (normalizedRoles.includes('ADMIN')) {
        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId,
              roleId: adminRole.id,
            },
          },
          update: {},
          create: {
            userId,
            roleId: adminRole.id,
          },
        });
      } else {
        await tx.userRole.deleteMany({
          where: {
            userId,
            roleId: adminRole.id,
          },
        });
      }
    });

    return await this.buildUserAccess(userId);
  }
}
