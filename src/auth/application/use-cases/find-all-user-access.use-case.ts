import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';

@Injectable()
export class FindAllUserAccessUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute() {
    return await this.usersRepository.findAllAccess();
  }
}
