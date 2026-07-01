import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString =
      process.env.MESSAGES_DATABASE_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('MESSAGES_DATABASE_URL or DATABASE_URL is not defined');
    }

    super({
      adapter: new PrismaPg(connectionString),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
