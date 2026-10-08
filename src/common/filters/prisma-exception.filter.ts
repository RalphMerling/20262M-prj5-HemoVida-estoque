import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { Prisma } from '../../generated/prisma/client';

/**
 * Rede de seguranca para erros do Prisma que escaparem do tratamento dos
 * services.
 *
 * Sem este filtro, uma violacao de unicidade viraria um 500 com a stack trace
 * do Prisma no corpo da resposta -- o que, alem de inutil para quem consome a
 * API, vaza nome de tabela, de coluna e de indice.
 *
 * Os services continuam tratando os casos que conhecem, porque ali da para
 * escrever uma mensagem especifica. Aqui ficam os que ninguem previu.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(erro: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();

    const { status, mensagem } = this.traduzir(erro);

    // A stack completa vai para o log do servidor, nao para o cliente.
    this.logger.warn(`Prisma ${erro.code}: ${erro.message.split('\n').pop()}`);

    resposta.status(status).json({
      statusCode: status,
      message: mensagem,
      error: erro.code,
    });
  }

  private traduzir(erro: Prisma.PrismaClientKnownRequestError): {
    status: number;
    mensagem: string;
  } {
    switch (erro.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          mensagem: 'Ja existe um registro com este valor unico',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          mensagem: 'Referencia invalida: o registro relacionado nao existe',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          mensagem: 'Registro nao encontrado',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          mensagem: 'Erro ao acessar o banco de dados',
        };
    }
  }
}
