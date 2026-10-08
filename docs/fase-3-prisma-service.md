# Fase 3 — PrismaService e /health

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Transformar o Prisma Client num serviço do Nest, com ciclo de vida gerenciado, e criar a primeira rota da API.

---

## Arquivos criados

| Arquivo | Papel |
|---|---|
| `src/prisma/prisma.service.ts` | `PrismaClient` como serviço injetável |
| `src/prisma/prisma.module.ts` | Módulo global que exporta o serviço |
| `src/health/health.controller.ts` | `GET /health` |
| `src/health/health.module.ts` | Módulo da rota |
| `src/app.module.ts` | Atualizado para importar os dois |

---

## Decisões

### `PrismaService extends PrismaClient`

O serviço herda do client gerado em vez de embrulhá-lo. Assim `prisma.user.findMany()` funciona direto, sem uma camada de repasse que só existiria para repetir a API do Prisma.

### `OnModuleInit` / `OnModuleDestroy`

```ts
async onModuleInit()    { await this.$connect(); }
async onModuleDestroy() { await this.$disconnect(); }
```

O `$connect()` explícito faz a conexão acontecer **no start da aplicação**, não na primeira requisição. Sem ele, um erro de credencial só apareceria quando o primeiro usuário chamasse a API — e apareceria como um 500 confuso, em vez de uma falha clara na subida.

O `$disconnect()` fecha o pool no encerramento, evitando conexões penduradas no servidor do Senac a cada reinício do `--watch`. Num banco compartilhado por uma turma inteira, isso importa: o MySQL tem limite de conexões simultâneas.

### `@Global()` no PrismaModule

Existe uma única conexão em toda a aplicação. Marcar o módulo como global evita ter que importá-lo em cada módulo de negócio. É um recurso a ser usado com parcimônia — infraestrutura compartilhada é um dos poucos casos em que ele se justifica.

### `GET /health` executa `SELECT 1`

A rota não se limita a responder "estou de pé":

```ts
await this.prisma.$queryRaw`SELECT 1`;
```

Sem essa consulta, `/health` responderia **200 mesmo com o banco fora do ar** — o que é pior do que não ter health check, porque dá uma confiança falsa. Com ela, a distinção fica clara:

| Situação | Resposta |
|---|---|
| API e banco OK | `200` · `{ status: "ok", database: "up", ... }` |
| API de pé, banco inacessível | `503` · `{ status: "erro", database: "down", ... }` |

O `503` (Service Unavailable) é o código correto: o serviço existe, mas não consegue atender no momento.

---

## O que rodar agora (no Windows)

```powershell
npm run start:dev
```

Depois, no navegador ou no terminal:

```powershell
curl http://localhost:3000/health
```

### Como saber que deu certo

- No log da subida aparece `Conectado ao banco de dados`
- `GET /health` responde **200** com `"database": "up"`

### Teste proposital de falha

Vale fazer uma vez. Troque a senha na `DATABASE_URL` por algo errado e suba de novo: a aplicação deve falhar **no start**, com erro de autenticação — não subir e quebrar depois. É essa a diferença que o `$connect()` no `onModuleInit` garante.

---

## Gerando pela CLI

```powershell
npx nest g module prisma
npx nest g service prisma --no-spec

npx nest g module health
npx nest g controller health --no-spec
```

O `nest g` faz duas coisas que valem ser vistas acontecendo: cria o arquivo já com o decorator correto **e** registra o novo módulo no `app.module.ts` automaticamente. O aluno não precisa lembrar de importar nada.

O `--no-spec` evita gerar arquivos de teste, que estão fora do escopo por enquanto.

**Escrito à mão:** o conteúdo dos quatro arquivos — herança do `PrismaClient`, o adapter, os hooks de ciclo de vida e o `SELECT 1` do health check. O gerador entrega o esqueleto; a lógica é do projeto.

---

## O client gerado

O `prisma generate` produziu, em `src/generated/prisma/`:

```
browser.ts · client.ts · commonInputTypes.ts · enums.ts · models.ts
internal/ · models/
```

O import usado no `PrismaService` está correto:

```ts
import { PrismaClient } from '../generated/prisma/client';
```

Duas coisas foram confirmadas depois da geração:

- `client.ts` exporta `PrismaClient` como **valor e tipo**, o que permite o `extends PrismaClient` do serviço
- os imports internos do código gerado **não usam extensão** (`from './enums'`), graças ao `moduleFormat = "cjs"` no bloco `generator`. Sem essa opção, o gerador emitiria `from './enums.js'` — que o TypeScript, configurado em CommonJS, não resolveria

Verificação: `npx tsc -p tsconfig.build.json --noEmit` termina sem erros com o client gerado incluído na compilação.

Lembrete: `src/generated/` está no `.gitignore`. Quem clonar o repositório precisa rodar `npm run prisma:generate` antes do primeiro build — é o que a seção de setup do README manda fazer.

---

## Próxima fase

**Fase 4 — Users:** CRUD completo, DTOs com validação, hash bcrypt e omissão da senha nas respostas. Ainda sem autenticação.
