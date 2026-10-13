
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
          transacao_status: 1,
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
      await tx.$queryRaw`
        SELECT transacao_id
        FROM transacao
        WHERE transacao_id = ${id}
        FOR UPDATE
      `;

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

      if (transacao.transacao_tipo === 'CANCELADA') {
        throw new BadRequestException(
          `A transação ${id} já está cancelada`,
        );
      }

      if (transacao.itens.length > 0) {
        throw new ConflictException(
          'Não é possível cancelar uma transação que possui itens associados',
        );
      }

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
          transacao_status: 0,
        },
      });

      if (atualizacao.count !== 1) {
        throw new ConflictException(
          'A transação foi alterada durante o cancelamento',
        );
      }

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
    const transacao = await this.buscarTransacaoPorId(
      transacaoId,
    );

    if (transacao.transacao_tipo === 'CANCELADA') {
      throw new ConflictException(
        'Não é possível adicionar itens a uma transação cancelada',
      );
    }

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

      if (transacao.transacao_tipo === 'CANCELADA') {
        throw new ConflictException(
          'Não é possível remover itens de uma transação cancelada',
        );
      }

      const item = await tx.transacaoItem.findFirst({
        where: {
          transacao_item_id: itemId,
          transacao_id: transacaoId,
        },
      });

      if (!item) {
        throw new NotFoundException(
          `Item ${itemId} não encontrado na transação ${transacaoId}`,
        );
      }

      if (item.transacao_item_status === 0) {
        throw new ConflictException(
          `O item ${itemId} já foi removido`,
        );
      }

      const atualizacao = await tx.transacaoItem.updateMany({
        where: {
          transacao_item_id: itemId,
          transacao_id: transacaoId,
          transacao_item_status: item.transacao_item_status,
        },
        data: {
          transacao_item_status: 0,
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
            transacao_item_id: itemId,
          },
        }),
      };
    });
  }

  // 12. Consultar os itens de uma transação
  async consultarItensTransacao(transacaoId: number) {
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

    return this.prisma.transacaoItem.findMany({
      where: {
        transacao_id: transacaoId,
      },
      orderBy: {
        transacao_item_id: 'asc',
      },
    });
  }
}
