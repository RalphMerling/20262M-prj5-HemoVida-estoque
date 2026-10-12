
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EstoqueService } from '../estoque/estoque.service';

import { CriarTransacaoDto } from './dto/criar-transacao.dto';
import { AdicionarItemTransacaoDto } from './dto/adicionar-item-transacao.dto';

@Injectable()
export class TransacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estoqueService: EstoqueService,
  ) {}

  // 6. Consultar todas as transações
  async consultarTransacao() {
    return this.prisma.transacao.findMany({
      orderBy: {
        transacao_id: 'asc',
      },
    });
  }

  // 7. Buscar uma transação pelo ID
  async buscarTransacaoPorId(id: number) {
    const transacao = await this.prisma.transacao.findUnique({
      where: {
        transacao_id: id,
      },
    });

    if (!transacao) {
      throw new NotFoundException(
        `Transação ${id} não encontrada`,
      );
    }

    return transacao;
  }

  // 8. Criar uma nova transação
  async criarTransacao(dto: CriarTransacaoDto) {
    // Impedir a criação de uma transação já cancelada
    if (
      dto.transacao_tipo?.trim().toUpperCase() ===
      'CANCELADA'
    ) {
      throw new BadRequestException(
        'Não é permitido criar uma transação com o tipo CANCELADA',
      );
    }

    try {
      return await this.prisma.transacao.create({
        data: {
          transacao_id: dto.transacao_id,
          transacao_tipo: dto.transacao_tipo ?? null,
          solicitacao_id: dto.solicitacao_id ?? null,
        },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe uma transação com o ID ${dto.transacao_id}`,
        );
      }

      throw erro;
    }
  }

  // 9. Cancelar uma transação
  async cancelarTransacao(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // ETAPA 16.4.2
      // Bloquear a linha da transação durante o cancelamento
      await tx.$queryRaw`
        SELECT transacao_id
        FROM transacao
        WHERE transacao_id = ${id}
        FOR UPDATE
      `;

      // Consultar a transação após obter o bloqueio
      const transacao = await tx.transacao.findUnique({
        where: {
          transacao_id: id,
        },
        include: {
          itens: true,
        },
      });

      if (!transacao) {
        throw new NotFoundException(
          `Transação ${id} não encontrada`,
        );
      }

      // Verificar se já está cancelada
      if (transacao.transacao_tipo === 'CANCELADA') {
        throw new BadRequestException(
          `A transação ${id} já está cancelada`,
        );
      }

      // Impedir cancelamento com itens associados
      if (transacao.itens.length > 0) {
        throw new ConflictException(
          'Não é possível cancelar uma transação que possui itens associados',
        );
      }

      // Atualizar somente se continuar sem itens
      const atualizacao = await tx.transacao.updateMany({
        where: {
          transacao_id: id,
          transacao_tipo: transacao.transacao_tipo,
          itens: {
            none: {},
          },
        },
        data: {
          transacao_tipo: 'CANCELADA',
        },
      });

      if (atualizacao.count !== 1) {
        throw new ConflictException(
          'A transação foi alterada durante o cancelamento',
        );
      }

      // Retornar a transação cancelada
      return tx.transacao.findUniqueOrThrow({
        where: {
          transacao_id: id,
        },
      });
    });
  }

  // 10. Adicionar um item a uma transação
  async adicionarItemTransacao(
    transacaoId: number,
    dto: AdicionarItemTransacaoDto,
  ) {
    // Verificar se a transação existe
    const transacao = await this.buscarTransacaoPorId(
      transacaoId,
    );

    // Impedir inclusão em transação cancelada
    if (transacao.transacao_tipo === 'CANCELADA') {
      throw new ConflictException(
        'Não é possível adicionar itens a uma transação cancelada',
      );
    }

    // Reutilizar a operação de saída do estoque
    // O EstoqueService aplica o bloqueio FOR UPDATE
    return this.estoqueService.registrarSaidaEstoque({
      estoque_id: dto.estoque_id,
      transacao_id: transacaoId,
      destino: dto.destino,
    });
  }

  // 11. Remover logicamente um item da transação
  async removerItemTransacao(
    transacaoId: number,
    itemId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Verificar se a transação existe
      const transacao = await tx.transacao.findUnique({
        where: {
          transacao_id: transacaoId,
        },
      });

      if (!transacao) {
        throw new NotFoundException(
          `Transação ${transacaoId} não encontrada`,
        );
      }

      // Impedir remoção em transação cancelada
      if (transacao.transacao_tipo === 'CANCELADA') {
        throw new ConflictException(
          'Não é possível remover itens de uma transação cancelada',
        );
      }

      // Localizar o item dentro da transação
      const item = await tx.transacaoItem.findFirst({
        where: {
          estoque_saida_id: itemId,
          transacao_id: transacaoId,
        },
      });

      if (!item) {
        throw new NotFoundException(
          `Item ${itemId} não encontrado na transação ${transacaoId}`,
        );
      }

      // Verificar se o item já foi removido
      if (item.estoque_saida_status === 0) {
        throw new ConflictException(
          `O item ${itemId} já foi removido`,
        );
      }

      // Realizar a exclusão lógica
      const atualizacao = await tx.transacaoItem.updateMany({
        where: {
          estoque_saida_id: itemId,
          transacao_id: transacaoId,
          estoque_saida_status: item.estoque_saida_status,
        },
        data: {
          estoque_saida_status: 0,
        },
      });

      if (atualizacao.count !== 1) {
        throw new ConflictException(
          'O item foi alterado durante a remoção',
        );
      }

      return {
        mensagem: 'Item removido logicamente com sucesso',
        item: await tx.transacaoItem.findUniqueOrThrow({
          where: {
            estoque_saida_id: itemId,
          },
        }),
      };
    });
  }

  // 12. Consultar os itens de uma transação
  async consultarItensTransacao(transacaoId: number) {
    // Verificar se a transação existe
    const transacao = await this.prisma.transacao.findUnique({
      where: {
        transacao_id: transacaoId,
      },
    });

    if (!transacao) {
      throw new NotFoundException(
        `Transação ${transacaoId} não encontrada`,
      );
    }

    // Consultar todos os itens, inclusive os removidos
    return this.prisma.transacaoItem.findMany({
      where: {
        transacao_id: transacaoId,
      },
      orderBy: {
        estoque_saida_id: 'asc',
      },
    });
  }
}
