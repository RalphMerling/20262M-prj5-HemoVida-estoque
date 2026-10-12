
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Habilitar o encerramento controlado da aplicação
  app.enableShutdownHooks();

  // Configurar cabeçalhos de segurança HTTP
  app.use(helmet());

  // Validar os dados recebidos pelos endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Obter a porta configurada no ambiente
  const config = app.get(ConfigService);
  const porta = config.get<number>('PORT', 3000);

  // Iniciar o servidor
  await app.listen(porta);

  Logger.log(
    `API no ar em http://localhost:${porta}`,
    'Bootstrap',
  );
}

void bootstrap();
