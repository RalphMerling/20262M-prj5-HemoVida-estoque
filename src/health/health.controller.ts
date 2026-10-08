import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';


import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Responde 200 se a API esta de pe E consegue falar com o banco.
   *
   * O SELECT 1 existe justamente para diferenciar "a API subiu" de "a API
   * consegue trabalhar": sem ele, a rota responderia 200 mesmo com o banco
   * fora do ar, que e o cenario mais comum de falha neste projeto.
   */
  @Get()
  async verificar(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (erro) {
      this.logger.error(
        `Banco inacessivel: ${erro instanceof Error ? erro.message : erro}`,
      );
      throw new ServiceUnavailableException({
        status: 'erro',
        database: 'down',
        detalhe: 'Nao foi possivel conectar ao banco de dados',
      });
    }

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
