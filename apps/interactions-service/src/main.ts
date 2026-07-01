import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { InteractionsServiceModule } from './interactions-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InteractionsServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.INTERACTIONS_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.INTERACTIONS_SERVICE_PORT ?? 3004),
      },
    },
  );

  await app.listen();
}

bootstrap();
