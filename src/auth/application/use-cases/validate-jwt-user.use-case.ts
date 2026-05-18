import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../interfaces/authenticated-user.interface';
import type { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { FindPublicUserByIdUseCase } from '../../../users/application/use-cases/find-public-user-by-id.use-case';

@Injectable()
export class ValidateJwtUserUseCase {
  constructor(
    private readonly findPublicUserByIdUseCase: FindPublicUserByIdUseCase,
  ) {}

  async execute(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.findPublicUserByIdUseCase.execute(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
