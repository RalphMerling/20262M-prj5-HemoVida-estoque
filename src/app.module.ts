
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { EstoqueModule } from './estoque/estoque.module';
import { AuthModule } from './auth/auth.module';
import { TransacoesModule } from './transacoes/transacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),

    PrismaModule,
    HealthModule,
    AuthModule,
    EstoqueModule,
    TransacoesModule,
  ],

  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {/** adicionar somente estas linhas do construtor  **/
  constructor() {
    console.log("Aplicação iniciada!");
    console.log("Banco:", process.env.DATABASE_URL);
    console.log("API Key:", process.env.API_KEY);
    console.log("JWT Secret:", process.env.JWT_SECRET);   
  }
  /** fim do adicionar  **/}
