import type { CreateUserDto } from '../../dto/create-user.dto';
import type { UpdateUserProfileDto } from '../../dto/update-user-profile.dto';
import type { SubscriptionPlan } from '../../../subscriptions/domain/entities/subscription-plan';
import type { PublicUser } from '../entities/public-user';
import type { UserAuthRecord } from '../entities/user-auth-record';

export abstract class UsersRepository {
  abstract create(
    createUserDto: CreateUserDto,
    hashedPassword: string,
  ): Promise<PublicUser>;

  abstract findByEmail(email: string): Promise<UserAuthRecord | null>;
  abstract findPublicById(id: number): Promise<PublicUser | null>;
  abstract findAllPublic(): Promise<PublicUser[]>;
  abstract updateProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<PublicUser>;
  abstract updatePlan(
    userId: number,
    plan: SubscriptionPlan,
  ): Promise<PublicUser>;
}
