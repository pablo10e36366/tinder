import { Injectable } from '@nestjs/common';
import { UpdateUserProfileDto } from '../../dto/update-user-profile.dto';
import type { PublicUser } from '../../domain/entities/public-user';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<PublicUser> {
    return await this.usersRepository.updateProfile(
      userId,
      updateUserProfileDto,
    );
  }
}
