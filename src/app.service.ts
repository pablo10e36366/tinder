import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'tinder-backend',
      status: 'ok',
      architecture: 'monolito modular con arquitectura hexagonal',
      modules: [
        'auth',
        'users',
        'subscriptions',
        'interactions',
        'matches',
        'messages',
      ],
    };
  }
}
