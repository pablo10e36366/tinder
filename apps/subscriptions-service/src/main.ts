import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { SubscriptionsServiceModule } from './subscriptions-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SubscriptionsServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SUBSCRIPTIONS_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.SUBSCRIPTIONS_SERVICE_PORT ?? 3003),
      },
    },
  );

  await app.listen();
}

bootstrap();
