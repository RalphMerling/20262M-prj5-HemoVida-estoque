
import { Module } from '@nestjs/common';

import { TransacoesController } from './transacoes.controller';
import { TransacoesService } from './transacoes.service';
import { EstoqueModule } from '../estoque/estoque.module';

@Module({
  imports: [EstoqueModule],
  controllers: [TransacoesController],
  providers: [TransacoesService],
})
export class TransacoesModule {}
