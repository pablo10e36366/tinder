import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PasswordHasherPort } from '../../../shared/application/ports/password-hasher.port';
import { CreateUserDto } from '../../dto/create-user.dto';
import type { PublicUser } from '../../domain/entities/public-user';
import { UsersRepository } from '../../domain/repositories/users.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(PasswordHasherPort)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<PublicUser> {
    try {
      const hashedPassword = await this.passwordHasher.hash(
        createUserDto.password,
      );

      return await this.usersRepository.create(createUserDto, hashedPassword);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('El email ya esta registrado');
      }

      throw error;
    }
  }
}
