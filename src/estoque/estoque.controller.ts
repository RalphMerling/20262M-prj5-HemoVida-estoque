
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

import { EstoqueService } from './estoque.service';

import { RegistrarEntradaEstoqueDto } from './dto/registrar-entrada-estoque.dto';
import { RegistrarSaidaEstoqueDto } from './dto/registrar-saida-estoque.dto';
import { AtualizarStatusEstoqueDto } from './dto/atualizar-status-estoque.dto';

import { Roles } from '../auth/decorators/roles.decorator';

@Controller('estoque')
export class EstoqueController {
  constructor(
    private readonly estoqueService: EstoqueService,
  ) {}

  // 1. Consultar todos os registros do estoque
  @Get()
  consultarEstoque() {
    return this.estoqueService.consultarEstoque();
  }

  // 2. Buscar um registro do estoque pelo ID
  @Get(':id')
  buscarEstoquePorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estoqueService.buscarEstoquePorId(id);
  }

  // 3. Registrar a entrada de uma bolsa no estoque
  @Roles('admin', 'operador')
  @Post('entrada')
  registrarEntradaEstoque(
    @Body() dto: RegistrarEntradaEstoqueDto,
  ) {
    return this.estoqueService.registrarEntradaEstoque(dto);
  }

  // 4. Registrar a saída de uma bolsa do estoque
  @Roles('admin', 'operador')
  @Post('saida')
  registrarSaidaEstoque(
    @Body() dto: RegistrarSaidaEstoqueDto,
  ) {
    return this.estoqueService.registrarSaidaEstoque(dto);
  }

  // 5. Atualizar o status de um registro do estoque
  @Roles('admin', 'operador')
  @Put(':id/status')
  atualizarStatusEstoque(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarStatusEstoqueDto,
  ) {
    return this.estoqueService.atualizarStatusEstoque(
      id,
      dto,
    );
  }

  // 6. Excluir uma bolsa sem movimentações
  // Operação permitida somente para administradores
  @Roles('admin')
  @Delete(':id')
  excluirBolsaEstoque(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estoqueService.excluirBolsaEstoque(id);
  }

  // 13. Consultar o histórico de um registro do estoque
  @Get(':id/historico')
  consultarHistoricoEstoque(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estoqueService.consultarHistoricoEstoque(
      id,
    );
  }
}
