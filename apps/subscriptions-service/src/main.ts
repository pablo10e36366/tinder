import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SubscriptionsServiceModule } from './subscriptions-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionsServiceModule);
  await app.listen(process.env.SUBSCRIPTIONS_SERVICE_PORT ?? 3003);
}

bootstrap();
