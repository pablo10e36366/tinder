import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { InteractionsServiceModule } from './interactions-service.module';

async function bootstrap() {
  const app = await NestFactory.create(InteractionsServiceModule);
  await app.listen(process.env.INTERACTIONS_SERVICE_PORT ?? 3004);
}

bootstrap();
