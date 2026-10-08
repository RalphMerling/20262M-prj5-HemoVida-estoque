import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Configuracao da CLI do Prisma.
 *
 * A partir do Prisma 7 o .env NAO e mais carregado automaticamente pela CLI --
 * e por isso que este arquivo comeca com `import 'dotenv/config'`. Sem essa
 * linha, `prisma db pull` e `prisma generate` nao enxergam DATABASE_URL.
 *
 * Nao ha bloco `migrations` aqui de proposito: este projeto nao usa migrations
 * (as tabelas ja existem no banco e os alunos nao tem permissao para cria-las).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
