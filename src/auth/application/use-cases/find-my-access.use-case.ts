import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import type { AuthenticatedUser } from '../../interfaces/authenticated-user.interface';

@Injectable()
export class FindMyAccessUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(user: AuthenticatedUser) {
    const access = await this.usersRepository.findAccessById(user.id);

    if (!access) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return access;
  }
}
