import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { MESSAGE_PATTERNS } from '@app/common';

interface EnsuredMatch {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
}

@Injectable()
export class MatchesServiceClient {
  constructor(
    @Inject('MATCHES_SERVICE') private readonly matchesClient: ClientProxy,
  ) {}

  async ensurePair(userAId: number, userBId: number): Promise<EnsuredMatch> {
    return await firstValueFrom(
      this.matchesClient.send(MESSAGE_PATTERNS.matches.ensurePair, {
        userAId,
        userBId,
      }),
    );
  }
}
