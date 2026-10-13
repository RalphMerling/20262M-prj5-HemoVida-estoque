
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { RegistrarEntradaEstoqueDto } from './dto/registrar-entrada-estoque.dto';
import { RegistrarSaidaEstoqueDto } from './dto/registrar-saida-estoque.dto';
import { AtualizarStatusEstoqueDto } from './dto/atualizar-status-estoque.dto';

@Injectable()
export class EstoqueService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // 1. Consultar todos os registros do estoque
  async consultarEstoque() {
    return this.prisma.estoque.findMany({
      orderBy: {
        estoque_id: 'asc',
      },
    });
  }

  // 2. Buscar um registro do estoque pelo ID
  async buscarEstoquePorId(id: number) {
    const estoque = await this.prisma.estoque.findUnique({
      where: {
        estoque_id: id,
      },
    });

    if (!estoque) {
      throw new NotFoundException(
        `Registro de estoque ${id} não encontrado`,
      );
    }

    return estoque;
  }

  // 3. Registrar a entrada de uma bolsa no estoque
  async registrarEntradaEstoque(
    dto: RegistrarEntradaEstoqueDto,
  ) {
    const bolsaExistente = await this.prisma.estoque.findFirst({
      where: {
        bolsa_id: dto.bolsa_id,
      },
    });

    if (bolsaExistente) {
      throw new ConflictException(
        `A bolsa ${dto.bolsa_id} já está cadastrada no estoque`,
      );
    }

    return this.prisma.estoque.create({
      data: {
        bolsa_id: dto.bolsa_id,
        estoque_data_entrada: new Date(),
        estoque_data_saida: null,
        estoque_status: 1,
      },
    });
  }

  // 4. Registrar a saída de uma bolsa do estoque
  async registrarSaidaEstoque(
    dto: RegistrarSaidaEstoqueDto,
  ) {
    if (!dto.destino.trim()) {
      throw new BadRequestException(
        'O destino não pode estar vazio',
      );
    }

    const agora = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Bloquear a transação durante a operação
      await tx.$queryRaw`
        SELECT transacao_id
        FROM transacao
        WHERE transacao_id = ${dto.transacao_id}
        FOR UPDATE
      `;

      const transacao = await tx.transacao.findUnique({
        where: {
          transacao_id: dto.transacao_id,
        },
      });

      if (!transacao) {
        throw new NotFoundException(
          `Transação ${dto.transacao_id} não encontrada`,
        );
      }

      if (transacao.transacao_tipo === 'CANCELADA') {
        throw new ConflictException(
          'Não é possível registrar saída em uma transação cancelada',
        );
      }

      const atualizacao = await tx.estoque.updateMany({
        where: {
          estoque_id: dto.estoque_id,
          estoque_status: 1,
          estoque_data_saida: null,
        },
        data: {
          estoque_status: 0,
          estoque_data_saida: agora,
        },
      });

      if (atualizacao.count !== 1) {
        const estoque = await tx.estoque.findUnique({
          where: {
            estoque_id: dto.estoque_id,
          },
        });

        if (!estoque) {
          throw new NotFoundException(
            `Registro de estoque ${dto.estoque_id} não encontrado`,
          );
        }

        throw new ConflictException(
          'A bolsa não está disponível para saída',
        );
      }

      const estoqueAtualizado =
        await tx.estoque.findUniqueOrThrow({
          where: {
            estoque_id: dto.estoque_id,
          },
        });

      const item = await tx.transacaoItem.create({
        data: {
          transacao_item_destino: dto.destino.trim(),
          transacao_item_data_saida: agora,
          transacao_item_status: 1,
          bolsa_id: estoqueAtualizado.bolsa_id,

          transacao: {
            connect: {
              transacao_id: dto.transacao_id,
            },
          },

          estoque: {
            connect: {
              estoque_id: dto.estoque_id,
            },
          },
        },
      });

      return {
        mensagem: 'Saída registrada com sucesso',
        estoque: estoqueAtualizado,
        transacao_item: item,
      };
    });
  }

  // 5. Atualizar o status de um registro do estoque
  async atualizarStatusEstoque(
    id: number,
    dto: AtualizarStatusEstoqueDto,
  ) {
    const atualizacao = await this.prisma.estoque.updateMany({
      where: {
        estoque_id: id,
        ...(dto.estoque_status === 1
          ? { estoque_data_saida: null }
          : {}),
      },
      data: {
        estoque_status: dto.estoque_status,
      },
    });

    if (atualizacao.count !== 1) {
      const estoque = await this.prisma.estoque.findUnique({
        where: {
          estoque_id: id,
        },
      });

      if (!estoque) {
        throw new NotFoundException(
          `Registro de estoque ${id} não encontrado`,
        );
      }

      throw new ConflictException(
        'Não é permitido disponibilizar uma bolsa que já teve saída registrada',
      );
    }

    return this.prisma.estoque.findUniqueOrThrow({
      where: {
        estoque_id: id,
      },
    });
  }

  // 6. Excluir uma bolsa sem movimentações registradas
  async excluirBolsaEstoque(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Bloquear a bolsa durante a verificação e exclusão
      const registros = await tx.$queryRaw<
        Array<{ estoque_id: number }>
      >`
        SELECT estoque_id
        FROM estoque
        WHERE estoque_id = ${id}
        FOR UPDATE
      `;

      if (registros.length === 0) {
        throw new NotFoundException(
          `Registro de estoque ${id} não encontrado`,
        );
      }

      // Impedir a exclusão de bolsas com movimentações
      const quantidadeMovimentacoes =
        await tx.transacaoItem.count({
          where: {
            estoque_id: id,
          },
        });

      if (quantidadeMovimentacoes > 0) {
        throw new ConflictException(
          'Não é possível excluir uma bolsa que possui movimentações registradas',
        );
      }

      const estoqueExcluido = await tx.estoque.delete({
        where: {
          estoque_id: id,
        },
      });

      return {
        mensagem: 'Bolsa excluída do estoque com sucesso',
        estoque: estoqueExcluido,
      };
    });
  }

  // 13. Consultar o histórico de um registro do estoque
  async consultarHistoricoEstoque(id: number) {
    const estoque = await this.prisma.estoque.findUnique({
      where: {
        estoque_id: id,
      },
    });

    if (!estoque) {
      throw new NotFoundException(
        `Registro de estoque ${id} não encontrado`,
      );
    }

    const movimentacoes =
      await this.prisma.transacaoItem.findMany({
        where: {
          estoque_id: id,
        },
        include: {
          transacao: true,
        },
        orderBy: {
          transacao_item_id: 'asc',
        },
      });

    return {
      estoque,
      movimentacoes,
    };
  }
}
