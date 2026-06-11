import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AUTHENTICATED_ROLES, Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateOrUpdateInteractionUseCase } from './application/use-cases/create-or-update-interaction.use-case';
import { FindSentInteractionsUseCase } from './application/use-cases/find-sent-interactions.use-case';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Controller('interactions')
export class InteractionsController {
  constructor(
    private readonly createOrUpdateInteractionUseCase: CreateOrUpdateInteractionUseCase,
    private readonly findSentInteractionsUseCase: FindSentInteractionsUseCase,
  ) {}

  @Post()
  @Roles(...AUTHENTICATED_ROLES)
  createOrUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createInteractionDto: CreateInteractionDto,
  ) {
    return this.createOrUpdateInteractionUseCase.execute(
      user.id,
      createInteractionDto,
    );
  }

  @Get('sent')
  @Roles(...AUTHENTICATED_ROLES)
  findSent(@CurrentUser() user: AuthenticatedUser) {
    return this.findSentInteractionsUseCase.execute(user.id);
  }
}
