import { Injectable } from '@nestjs/common';

import type { PublicUser } from '../../domain/entities/public-user';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(): Promise<PublicUser[]> {
    return await this.usersRepository.findAllPublic();
  }
}
