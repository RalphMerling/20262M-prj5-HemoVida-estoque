
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const databaseUrl =
      config.getOrThrow<string>('DATABASE_URL');

    super({
      adapter: new PrismaMariaDb(databaseUrl),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    this.logger.log('Conectado ao banco de dados');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();

    this.logger.log('Desconectado do banco de dados');
  }
}
