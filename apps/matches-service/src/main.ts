import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { MatchesServiceModule } from './matches-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MatchesServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MATCHES_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.MATCHES_SERVICE_PORT ?? 3005),
      },
    },
  );

  await app.listen();
}

bootstrap();
