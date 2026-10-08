import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Cabecalhos de seguranca (CSP, X-Frame-Options, HSTS e outros).
  // Uma linha que fecha uma familia inteira de problemas conhecidos.
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      // Remove do payload qualquer campo que nao esteja declarado no DTO.
      whitelist: true,
      // E devolve 400 se o cliente mandar um campo a mais.
      // E isto que impede alguem de enviar "role": "admin" no cadastro.
      forbidNonWhitelisted: true,
      // Converte o payload para a classe do DTO (e os tipos declarados nela).
      transform: true,
    }),
  );

  configurarSwagger(app);

  const config = app.get(ConfigService);
  const porta = config.get<number>('PORT', 3000);

  await app.listen(porta);

  Logger.log(`API no ar em http://localhost:${porta}`, 'Bootstrap');
  Logger.log(`Documentacao em http://localhost:${porta}/docs`, 'Bootstrap');
}

function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('NodeNestPrisma API')
    .setDescription(
      [
        'CRUD de Usuarios, Enderecos e Contatos com autenticacao JWT e RBAC.',
        '',
        '**Como usar esta pagina:**',
        '1. Faca `POST /login` com email e senha.',
        '2. Copie o `access_token` da resposta.',
        '3. Clique em **Authorize** (cadeado, no topo) e cole o token.',
        '4. As rotas protegidas passam a funcionar.',
        '',
        '**Matriz de acesso:**',
        '',
        '| Rota | Quem pode |',
        '|---|---|',
        '| `POST /login` | aberto |',
        '| `GET /user`, `GET /user/:id` | aberto (sem a senha) |',
        '| `POST /user` | aberto (perfil sempre `user`) |',
        '| `PUT /user/:id` | admin ou o proprio usuario |',
        '| `DELETE /user/:id` | somente admin |',
        '| `/address/*`, `/contact/*` | admin ou o dono do registro |',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documento, {
    // Mantem o token preenchido depois de recarregar a pagina.
    swaggerOptions: { persistAuthorization: true },
  });
}

void bootstrap();
