import { Injectable } from '@nestjs/common';

import { UsersServiceClient } from '../../infrastructure/clients/users-service.client';

@Injectable()
export class FindAllUserAccessUseCase {
  constructor(private readonly usersServiceClient: UsersServiceClient) {}

  async execute() {
    return await this.usersServiceClient.findAllAccess();
  }
}
