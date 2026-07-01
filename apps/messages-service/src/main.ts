import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { MessagesServiceModule } from './messages-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MessagesServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MESSAGES_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.MESSAGES_SERVICE_PORT ?? 3006),
      },
    },
  );

  await app.listen();
}

bootstrap();
