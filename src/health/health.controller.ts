import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async verificar() {
    try { 
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (erro) {
      this.logger.error(`Banco inacessivel: ${erro}`);
      throw new ServiceUnavailableException({
        status: 'erro',
        database: 'down',
      });
    }   

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}