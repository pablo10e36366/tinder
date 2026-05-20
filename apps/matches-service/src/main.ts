import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MatchesServiceModule } from './matches-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MatchesServiceModule);
  await app.listen(process.env.MATCHES_SERVICE_PORT ?? 3005);
}

bootstrap();
