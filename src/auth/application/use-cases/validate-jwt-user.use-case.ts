import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../interfaces/authenticated-user.interface';
import type { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { FindUserAuthByEmailUseCase } from '../../../users/application/use-cases/find-user-auth-by-email.use-case';

@Injectable()
export class ValidateJwtUserUseCase {
  constructor(
    private readonly findUserAuthByEmailUseCase: FindUserAuthByEmailUseCase,
  ) {}

  async execute(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.findUserAuthByEmailUseCase.execute(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };
  }
}
