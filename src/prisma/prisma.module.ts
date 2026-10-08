import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Marcado como @Global para que qualquer modulo possa injetar o PrismaService
 * sem precisar importar o PrismaModule toda vez. Como existe uma unica conexao
 * com o banco em toda a aplicacao, este e um dos poucos casos em que um modulo
 * global se justifica.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
