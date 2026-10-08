import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';

/**
 * O driver `mariadb` -- usado pelo adaptador do Prisma 7 para MySQL -- so aceita
 * connection strings no esquema `mariadb://`. Ja a CLI do Prisma exige
 * `mysql://`, porque e esse o provider declarado no schema.
 *
 * Em vez de manter duas variaveis de ambiente que podem sair de sincronia,
 * guardamos uma unica DATABASE_URL no formato `mysql://` (o que a CLI espera)
 * e trocamos o esquema aqui, no unico ponto onde o driver e instanciado.
 */
function paraUrlDoDriver(url: string): string {
  return url.replace(/^mysql:\/\//, 'mariadb://');
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaMariaDb(
        paraUrlDoDriver(config.getOrThrow<string>('DATABASE_URL')),
      ),
      // Omissao GLOBAL da senha: nenhuma consulta a `user` devolve o hash,
      // em nenhum lugar da aplicacao, a menos que peca explicitamente o
      // contrario com `omit: { senha: false }` -- o que so o login faz.
      //
      // E mais seguro do que filtrar no controller: ali basta esquecer um
      // caminho para o hash vazar. Aqui o padrao e nao vazar.
      omit: {
        user: { senha: true },
      },
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
