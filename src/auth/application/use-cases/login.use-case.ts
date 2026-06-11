import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasherPort } from '../../../shared/application/ports/password-hasher.port';
import { FindUserAuthByEmailUseCase } from '../../../users/application/use-cases/find-user-auth-by-email.use-case';
import { LoginDto } from '../../dto/login.dto';
import type { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { TokenSignerPort } from '../../domain/ports/token-signer.port';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly findUserAuthByEmailUseCase: FindUserAuthByEmailUseCase,
    @Inject(PasswordHasherPort)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TokenSignerPort)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  async execute(loginDto: LoginDto) {
    const user = await this.findUserAuthByEmailUseCase.execute(loginDto.email);

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
