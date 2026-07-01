import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { PasswordHasherPort } from '@app/common';
import type { JwtPayload, LoginDto } from '@app/common';
import { TokenSignerPort } from '../../domain/ports/token-signer.port';
import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly usersServiceClient: UsersServiceClient,
    @Inject(PasswordHasherPort)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TokenSignerPort)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  async execute(loginDto: LoginDto) {
    const user = await this.usersServiceClient.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await this.passwordHasher.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.tokenSigner.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}
