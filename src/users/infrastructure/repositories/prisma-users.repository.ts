import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { publicUserSelect } from '../../../shared/infrastructure/prisma/public-user.select';
import { normalizePublicUser } from '../../../shared/utils/normalize-public-user';
import type { SubscriptionPlan } from '../../../subscriptions/domain/entities/subscription-plan';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserProfileDto } from '../../dto/update-user-profile.dto';
import type { PublicUser } from '../../domain/entities/public-user';
import type { UserAuthRecord } from '../../domain/entities/user-auth-record';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    hashedPassword: string,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: publicUserSelect,
    });

    return normalizePublicUser(user as PublicUser);
  }

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });
  }

  async findPublicById(id: number): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    return user ? normalizePublicUser(user as PublicUser) : null;
  }

  async findAllPublic(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      select: publicUserSelect,
    });

    return users.map((user) => normalizePublicUser(user as PublicUser));
  }

  async updateProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserProfileDto,
      select: publicUserSelect,
    });

    return normalizePublicUser(user as PublicUser);
  }

  async updatePlan(userId: number, plan: SubscriptionPlan): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { plan } as any,
      select: publicUserSelect,
    });

    return normalizePublicUser(user as PublicUser);
  }
}
