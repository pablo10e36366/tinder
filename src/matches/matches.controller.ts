import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FindMyMatchesUseCase } from './application/use-cases/find-my-matches.use-case';

@Controller('matches')
export class MatchesController {
  constructor(private readonly findMyMatchesUseCase: FindMyMatchesUseCase) {}

  @Get()
  @Roles(...AUTHENTICATED_ROLES)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.findMyMatchesUseCase.execute(user.id);
  }
}
