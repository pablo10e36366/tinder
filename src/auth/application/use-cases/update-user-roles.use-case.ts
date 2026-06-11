import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../users/domain/repositories/users.repository';
import { UpdateUserRolesDto } from '../../dto/update-user-roles.dto';

@Injectable()
export class UpdateUserRolesUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(userId: number, dto: UpdateUserRolesDto) {
    return await this.usersRepository.updateAccessRoles(userId, dto.roles);
  }
}
