import { Injectable } from '@nestjs/common';
import type { UserAuthRecord } from '../../domain/entities/user-auth-record';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class FindUserAuthByEmailUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(email: string): Promise<UserAuthRecord | null> {
    return await this.usersRepository.findByEmail(email);
  }
}
