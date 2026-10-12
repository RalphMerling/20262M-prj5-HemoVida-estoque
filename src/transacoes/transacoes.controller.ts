
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { TransacoesService } from './transacoes.service';

import { CriarTransacaoDto } from './dto/criar-transacao.dto';
import { AdicionarItemTransacaoDto } from './dto/adicionar-item-transacao.dto';

import { Roles } from '../auth/decorators/roles.decorator';

@Controller('transacoes')
export class TransacoesController {
  constructor(
    private readonly transacoesService: TransacoesService,
  ) {}

  // 6. Consultar todas as transações
  // Exige JWT válido
  @Get()
  consultarTransacao() {
    return this.transacoesService.consultarTransacao();
  }

  // 7. Buscar uma transação pelo ID
  // Exige JWT válido
  @Get(':id')
  buscarTransacaoPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transacoesService.buscarTransacaoPorId(id);
  }

  // 8. Criar uma nova transação
  @Roles('admin', 'operador')
  @Post()
  criarTransacao(
    @Body() dto: CriarTransacaoDto,
  ) {
    return this.transacoesService.criarTransacao(dto);
  }

  // 9. Cancelar uma transação
  @Roles('admin', 'operador')
  @Put(':id/cancelar')
  cancelarTransacao(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transacoesService.cancelarTransacao(id);
  }

  // 10. Adicionar um item a uma transação
  @Roles('admin', 'operador')
  @Post(':id/itens')
  adicionarItemTransacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdicionarItemTransacaoDto,
  ) {
    return this.transacoesService.adicionarItemTransacao(
      id,
      dto,
    );
  }

  // 11. Remover logicamente um item da transação
  @Roles('admin', 'operador')
  @Delete(':id/itens/:itemId')
  removerItemTransacao(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.transacoesService.removerItemTransacao(
      id,
      itemId,
    );
  }

  // 12. Consultar os itens de uma transação
  // Exige JWT válido
  @Get(':id/itens')
  consultarItensTransacao(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transacoesService.consultarItensTransacao(
      id,
    );
  }
}