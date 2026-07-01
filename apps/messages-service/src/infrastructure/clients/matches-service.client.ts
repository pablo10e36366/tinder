import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MESSAGE_PATTERNS } from '@app/common';

interface AccessibleMatch {
  id: number;
  user1Id: number;
  user2Id: number;
}

@Injectable()
export class MatchesServiceClient {
  constructor(
    @Inject('MATCHES_SERVICE') private readonly matchesClient: ClientProxy,
  ) {}

  async findAccessibleById(
    matchId: number,
    userId: number,
  ): Promise<AccessibleMatch | null> {
    return await firstValueFrom(
      this.matchesClient.send(MESSAGE_PATTERNS.matches.findAccessibleById, {
        matchId,
        userId,
      }),
    );
  }
}
