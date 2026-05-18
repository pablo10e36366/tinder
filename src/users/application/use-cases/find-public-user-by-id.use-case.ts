import { Injectable } from '@nestjs/common';
import type { PublicUser } from '../../domain/entities/public-user';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class FindPublicUserByIdUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(id: number): Promise<PublicUser | null> {
    return await this.usersRepository.findPublicById(id);
  }
}
