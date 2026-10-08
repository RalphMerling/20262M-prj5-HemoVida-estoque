# API REST com NestJS e Prisma — passo a passo

**Curso:** Análise e Desenvolvimento de Sistemas
**O que vamos construir:** uma API de cadastro de usuários, endereços e contatos, com login, controle de acesso por perfil e documentação interativa.

---

## Antes de começar

### O que você vai construir

Uma API REST que:

- cadastra, lista, atualiza e remove **usuários**, **endereços** e **contatos**
- exige **login** e devolve um token para as rotas protegidas
- diferencia **administrador** de **usuário comum**
- garante que ninguém leia nem altere os dados de outra pessoa
- documenta tudo numa página web onde você mesmo testa cada rota

### O que você vai aprender no caminho

Mais importante do que a API pronta:

- por que se fixa a versão de cada dependência
- por que a senha nunca é guardada como você digitou
- por que um campo *ausente* num formulário pode ser uma decisão de segurança
- como o mesmo endereço de rota pode significar coisas diferentes
- como ler uma mensagem de erro em vez de tentar sorte

### Convenção deste material

Cada comando vem acompanhado da explicação do que ele faz. **Não pule as explicações.** Um comando que você digita sem entender vira superstição: funciona, você não sabe por quê, e no primeiro erro não sabe onde mexer.

Os trechos assim:

> Explicação do comando acima.

são a parte que você precisa conseguir repetir com suas palavras depois da aula.

### Pré-requisitos

| Item | Como conferir |
|---|---|
| Node.js 24 LTS | `node -v` deve mostrar `v24.x.x` |
| Um cliente MySQL | HeidiSQL, DBeaver ou MySQL Workbench |
| VS Code | com as extensões **Prisma** e **ESLint** |
| Acesso ao banco da disciplina | host, usuário e senha fornecidos pelo professor |

Se o `node -v` mostrar outra versão ou der erro:

```powershell
winget install OpenJS.NodeJS.LTS
```

> Instala o Node.js na versão LTS (Long Term Support), que é a recomendada para produção. Feche e reabra o terminal depois.

---

## Parte 1 — Criar o projeto

### 1.1 Gerar a estrutura

```powershell
npx @nestjs/cli@12.0.3 new nodenestprisma --package-manager npm --skip-git
```

> `npx` roda um pacote sem instalá-lo permanentemente. `@nestjs/cli@12.0.3` é a ferramenta oficial do NestJS, na versão exata que vamos usar. `new nodenestprisma` cria a pasta do projeto com a estrutura padrão. `--package-manager npm` evita a pergunta sobre qual gerenciador usar. `--skip-git` não inicializa repositório agora — faremos isso quando o `.gitignore` estiver pronto, para não versionar segredo por acidente.

```powershell
cd nodenestprisma
```

### 1.2 Fixar as versões

```powershell
npm i --save-exact @nestjs/common@12.0.3 @nestjs/core@12.0.3 @nestjs/platform-express@12.0.3 @nestjs/config@12.0.0 class-validator@0.15.1 class-transformer@0.5.1 reflect-metadata@0.2.2 rxjs@7.8.2
```

> `npm i` instala pacotes. `--save-exact` é o detalhe importante: sem ele, o npm grava `"^12.0.3"` no `package.json`, e o acento circunflexo autoriza atualizações automáticas. Com ele, grava `"12.0.3"` exato. Numa turma inteira, isso significa que todo mundo roda a mesma coisa — e que o projeto que funciona hoje continua funcionando em novembro.

```powershell
npm i -D --save-exact typescript@6.0.3 @nestjs/cli@12.0.3 @nestjs/schematics@12.0.3 @types/node@24.13.5 @types/express@5.0.6
```

> `-D` (abreviação de `--save-dev`) marca como dependência de **desenvolvimento**: são ferramentas para construir o projeto, não para executá-lo. Elas não vão para o servidor em produção.

**Por que TypeScript 6 e não a versão mais nova?** Se você rodar `npm i typescript` hoje, virá a **7.0.2** — que é a reescrita do compilador em Go. O NestJS 12 é validado com a linha **6.x**. Instalar a 7 aqui quebra a compilação. É o primeiro exemplo prático de por que "a mais recente" nem sempre é "a certa".

```powershell
npm pkg set engines.node=">=24.0.0"
```

> `npm pkg set` edita o `package.json` pelo terminal, sem abrir o arquivo. Aqui declara que o projeto exige Node 24 ou superior. Quem tentar instalar com uma versão antiga recebe um aviso claro em vez de um erro confuso lá na frente.

### 1.3 Ajustar o TypeScript

Abra `tsconfig.json` e deixe o bloco `compilerOptions` assim:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2023",
    "lib": ["ES2023"],

    "rootDir": "./src",
    "outDir": "./dist",

    "declaration": true,
    "sourceMap": true,
    "removeComments": true,

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,

    "strict": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Três linhas merecem atenção:

- **`rootDir`** — no TypeScript 6 ela deixou de ser deduzida automaticamente. Sem ela, você recebe o erro `TS5011` e o build gera `dist/src/main.js` em vez de `dist/main.js`.
- **`experimentalDecorators`** e **`emitDecoratorMetadata`** — são o que faz `@Injectable()`, `@Controller()` e companhia funcionarem. Todo o NestJS depende disso.
- **não use `baseUrl`** — está depreciada e some no TypeScript 7. Se algum tutorial mandar você colocar, ignore.

**Não ative `"incremental": true`.** Ela grava um arquivo de cache na raiz do projeto, o observador de mudanças detecta esse arquivo como alteração, recompila, grava de novo — e a aplicação entra num ciclo de reinícios infinitos.

### 1.4 Proteger os segredos

Crie o arquivo `.gitignore`:

```gitignore
/node_modules
/dist
*.tsbuildinfo

# segredos — NUNCA versionar
.env
.env.local

# Prisma Client gerado
/src/generated

*.log
.DS_Store
Thumbs.db
```

Crie também `.nvmrc` com uma única linha:

```
24
```

> Quem usa **nvm** (gerenciador de versões do Node) troca para a versão correta com um comando só. É uma cortesia para quem for clonar o projeto depois — inclusive você mesmo, daqui a seis meses.

Agora sim, inicialize o repositório:

```powershell
git init
git add .
git commit -m "Estrutura inicial do projeto"
```

> A ordem importa. Se você tivesse rodado `git init` antes do `.gitignore`, correria o risco de versionar o `.env` no primeiro commit. Segredo que entra no histórico do Git **não sai** — mesmo apagando o arquivo depois, ele continua lá nos commits anteriores.

---

## Parte 2 — Configuração e variáveis de ambiente

### 2.1 O modelo de configuração

Crie `.env.example`:

```
# Copie este arquivo para .env e preencha os valores.
# O .env NUNCA vai para o Git.

DATABASE_URL="mysql://USUARIO:SENHA@edumysql.acesso.rj.senac.br:3306/NOME_DO_BANCO"

# Mínimo de 32 caracteres. Gere o seu com:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=

JWT_EXPIRES_IN=1h
PORT=3000
```

> O `.env.example` vai para o Git; o `.env` não. Assim quem clona o projeto sabe **quais** variáveis precisa preencher, sem nunca ver os valores de ninguém.

### 2.2 Criar o seu .env

```powershell
Copy-Item .env.example .env
```

> Cria o arquivo real a partir do modelo. É o equivalente ao `cp` do Linux.

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> `node -e` executa um código JavaScript direto no terminal. Este gera 48 bytes aleatórios criptograficamente seguros e os converte em texto. Copie o resultado para o `JWT_SECRET`.
>
> Por que não inventar uma senha de cabeça: um segredo escolhido por humano é previsível. Quem descobrir o seu `JWT_SECRET` consegue **fabricar tokens válidos** e entrar como qualquer usuário, inclusive administrador.

Preencha também a `DATABASE_URL` com o usuário e a senha do banco.

> Atenção: se a senha tiver `@`, `:`, `/`, `#` ou `?`, ela precisa ir codificada (URL-encoded), senão a URL quebra. Um `@` na senha vira `%40`.

### 2.3 Validar a configuração no boot

Crie a pasta e o arquivo `src/config/env.validation.ts`:

```ts
import { plainToInstance } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsString, Matches, Max, Min, MinLength, validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL e obrigatoria' })
  @Matches(/^mysql:\/\//, { message: 'DATABASE_URL deve comecar com mysql://' })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET deve ter no minimo 32 caracteres' })
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^\d+(ms|s|m|h|d)$/, {
    message: 'JWT_EXPIRES_IN deve ser algo como 15m, 1h ou 7d',
  })
  JWT_EXPIRES_IN!: string;

  @IsInt({ message: 'PORT deve ser um numero inteiro' })
  @Min(1)
  @Max(65535)
  PORT!: number;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validado = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const erros = validateSync(validado, { skipMissingProperties: false });

  if (erros.length > 0) {
    const detalhes = erros
      .map((erro) => Object.values(erro.constraints ?? {}).join('; '))
      .join('\n  - ');

    throw new Error(`Configuracao invalida. Revise o seu .env:\n  - ${detalhes}\n`);
  }

  return validado;
}
```

**Por que isso existe.** Sem essa validação, um `.env` com `JWT_SECRET` vazio não daria erro nenhum: a aplicação subiria normalmente e passaria a assinar tokens com segredo vazio — uma falha grave que **não aparece**. Com a validação, o processo morre no start dizendo exatamente o que está errado.

A regra geral: **falhe cedo e alto**. Um erro na subida custa trinta segundos; o mesmo erro descoberto em produção custa muito mais.

### 2.4 Registrar no módulo raiz

Substitua `src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],
})
export class AppModule {}
```

> `isGlobal: true` disponibiliza o `ConfigService` em toda a aplicação sem precisar importar o módulo em cada lugar. `cache: true` guarda os valores em memória. `validate` aponta para a função que acabamos de escrever.

### 2.5 Configurar o `main.ts`

```ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const porta = config.get<number>('PORT', 3000);

  await app.listen(porta);
  Logger.log(`API no ar em http://localhost:${porta}`, 'Bootstrap');
}

void bootstrap();
```

As três opções do `ValidationPipe` são decisões de segurança, não de estilo:

| Opção | O que faz | Por que importa |
|---|---|---|
| `whitelist` | Remove do corpo da requisição qualquer campo que o DTO não declare | Lixo enviado pelo cliente não chega ao banco |
| `forbidNonWhitelisted` | Devolve **400** se vier campo a mais | Um campo não declarado é **recusado**, não ignorado em silêncio |
| `transform` | Converte o JSON para a classe do DTO | Faz os tipos declarados valerem de verdade em tempo de execução |

O `forbidNonWhitelisted` vai ser, daqui a pouco, o que impede alguém de se cadastrar como administrador.

### 2.6 Primeiro teste

```powershell
npm run start:dev
```

> Sobe a aplicação em modo de desenvolvimento: ela recompila e reinicia sozinha a cada arquivo salvo. Por baixo roda `nest start --watch`.
>
> **Não instale o Nodemon.** O NestJS já faz isso. Adicionar o Nodemon seria uma segunda ferramenta fazendo exatamente o mesmo trabalho.

Você deve ver `API no ar em http://localhost:3000`. Abra o navegador nesse endereço: vem **404**, e está certo — ainda não existe rota nenhuma.

**Agora o teste que ensina.** Apague o valor de `JWT_SECRET` no `.env` e rode de novo. A aplicação deve **morrer no start**, reclamando dos 32 caracteres. Devolva o valor depois.

Essa é a diferença entre um projeto que avisa e um que engana.

---

## Parte 3 — Conectar ao banco com o Prisma

O Prisma é um ORM: em vez de escrever SQL na mão, você descreve as tabelas e ele gera um cliente com tipagem completa.

Nosso caso tem uma particularidade importante: **as tabelas já existem**. Então o fluxo é o inverso do normal — em vez de o Prisma criar o banco a partir do código, ele vai **ler o banco** e gerar o código.

### 3.1 Instalar

```powershell
npm i --save-exact @prisma/client@7.10.0 @prisma/adapter-mariadb@7.10.0
```

> `@prisma/client` é o cliente usado pela aplicação em execução. `@prisma/adapter-mariadb` é o driver que efetivamente conversa com o MySQL — a partir do Prisma 7 ele é **obrigatório**, porque o motor antigo (escrito em Rust) foi removido e a conexão passou a usar drivers JavaScript de verdade.

```powershell
npm i -D --save-exact prisma@7.10.0 dotenv@17.4.2
```

> `prisma` é a ferramenta de linha de comando; só serve no desenvolvimento, daí o `-D`. `dotenv` carrega o `.env` para os comandos do Prisma.

**Repare na versão exata.** Se você rodar `npm i prisma` sem a versão, o npm instala a **8.0.0-rc**, que é um *release candidate* — e que ainda **não suporta MySQL**. Você descobriria isso do jeito difícil, com um erro sem relação aparente.

### 3.2 Inicializar

```powershell
npx prisma init --datasource-provider mysql --output ../src/generated/prisma
```

> Cria a pasta `prisma/` com o arquivo `schema.prisma`, e o `prisma.config.ts` na raiz. `--datasource-provider mysql` já deixa o dialeto configurado. `--output` define onde o cliente gerado será escrito.

Confira o `prisma.config.ts` — ele precisa estar assim:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

> A primeira linha, `import 'dotenv/config'`, é essencial. **A partir do Prisma 7 a CLI não lê mais o `.env` automaticamente.** Sem ela, os comandos do Prisma não enxergam a `DATABASE_URL` e o erro que aparece não aponta para a causa.

### 3.3 Ler o banco

```powershell
npx prisma db pull
```

> Este é o comando central desta parte. Ele **conecta no banco, lê a estrutura real das tabelas e escreve os modelos** no `schema.prisma`. Você não transcreve nada à mão — e por isso não erra um tipo ou um tamanho de coluna.
>
> Atenção: ele **sobrescreve** o `schema.prisma`. Rode antes de qualquer ajuste manual.

Abra o `prisma/schema.prisma` e veja o que ele gerou: três modelos chamados `usuarios`, `contatos` e `enderecos`, com todas as colunas e índices.

### 3.4 Refinar o que a introspecção não tem como adivinhar

A introspecção acerta a estrutura, mas não conhece nossas convenções nem nossas decisões. Ajuste o arquivo para ficar assim:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  runtime      = "nodejs"
  moduleFormat = "cjs"
}

datasource db {
  provider = "mysql"
}

model User {
  id             Int       @id @default(autoincrement())
  nome           String    @db.VarChar(120)
  email          String    @unique(map: "email") @db.VarChar(150)
  senha          String    @db.VarChar(120)
  dataNascimento DateTime? @db.Date
  rg             String?   @db.VarChar(20)
  cpf            String?   @unique(map: "cpf") @db.VarChar(20)
  createdAt      DateTime  @default(now()) @db.DateTime(0)
  updatedAt      DateTime  @updatedAt @db.DateTime(0)
  nomeMae        String?   @default("Não informado") @map("NomeMae") @db.VarChar(255)
  role           String?   @default("user") @db.VarChar(50)

  enderecos Address[]
  contatos  Contact[]

  @@map("usuarios")
}

model Address {
  id          Int      @id @default(autoincrement())
  idUsuario   Int
  cep         String   @db.VarChar(20)
  rua         String   @db.VarChar(150)
  numero      String   @db.VarChar(20)
  complemento String?  @db.VarChar(100)
  bairro      String   @db.VarChar(100)
  cidade      String   @db.VarChar(100)
  estado      String   @db.VarChar(2)
  createdAt   DateTime @default(now()) @db.DateTime(0)
  updatedAt   DateTime @updatedAt @db.DateTime(0)

  usuario User @relation(fields: [idUsuario], references: [id], onDelete: Cascade, onUpdate: Cascade, map: "enderecos_ibfk_1")

  @@index([idUsuario], map: "idUsuario")
  @@map("enderecos")
}

model Contact {
  id             Int      @id @default(autoincrement())
  idUsuario      Int
  numeroTelefone String   @db.VarChar(30)
  createdAt      DateTime @default(now()) @db.DateTime(0)
  updatedAt      DateTime @updatedAt @db.DateTime(0)

  usuario User @relation(fields: [idUsuario], references: [id], onDelete: Cascade, onUpdate: Cascade, map: "contatos_ibfk_1")

  @@index([idUsuario], map: "idUsuario")
  @@map("contatos")
}
```

O que mudou e por quê:

| Mudança | Motivo |
|---|---|
| `usuarios` virou `model User` + `@@map("usuarios")` | Convenção do Prisma: modelo em inglês e singular. O `@@map` amarra à tabela real, então o banco não muda |
| `NomeMae` virou `nomeMae` + `@map("NomeMae")` | camelCase no código, nome original na tabela |
| `@default(now())` no `createdAt` | As colunas são `NOT NULL` **sem default no banco**. Quem preenche é o Prisma — sem isso, todo `INSERT` falharia |
| `@updatedAt` | O Prisma atualiza a data a cada alteração |
| `role` com `@default("user")` | **Divergência proposital.** O banco tem `DEFAULT 'admin'`, o que é uma falha de segurança. Como não podemos alterar o banco, a aplicação nunca deixa esse default agir |
| `moduleFormat = "cjs"` | Sem isso o código gerado usa imports com `.js`, que o TypeScript em CommonJS não resolve |

Repare também que o bloco `datasource` tem **apenas o `provider`**. No Prisma 7 a propriedade `url` foi removida do schema — ela vive só no `prisma.config.ts`. Praticamente todo tutorial na internet ainda mostra o `url` ali dentro; copiar um exemplo antigo gera o erro `P1012`.

### 3.5 Gerar o cliente

```powershell
npx prisma generate
```

> Lê o `schema.prisma` e gera, em `src/generated/prisma/`, o código TypeScript do cliente — com um método tipado para cada modelo. É ele que faz `prisma.user.findMany()` existir e o editor saber quais campos `user` tem.
>
> **Este comando precisa ser rodado sempre que o schema mudar**, e também por quem clonar o projeto — porque `src/generated/` está no `.gitignore`.

### 3.6 Um comando útil para o resto do semestre

```powershell
npm pkg set scripts.prisma:generate="prisma generate"
npm pkg set scripts.prisma:check="prisma migrate diff --from-schema prisma/schema.prisma --to-config-datasource --exit-code"
```

> `prisma:check` compara o que está no seu `schema.prisma` com o que existe de fato no banco, **sem alterar nada**. Como o banco é compartilhado pela turma, é a forma rápida de responder "alguém mexeu na estrutura?".

```powershell
npm run prisma:check
```

A saída esperada **não é** "nenhuma diferença". Você verá exatamente isto:

```
[*] Changed the `usuarios` table
  [*] Altered column `createdAt` (default changed from `Some(Now)` to `None`)
  [*] Altered column `role` (default changed from ... "user" ... to ... "admin" ...)
```

São as duas divergências propositais da tabela acima. **Qualquer linha além dessas é divergência real** e merece investigação.

### 3.7 Migrations: por que não existem aqui

Você vai ver muito tutorial mandando rodar `prisma migrate dev`. **Não rode neste projeto.**

Migrations servem para o código criar e alterar tabelas. Aqui as tabelas já existem, estão populadas, e o usuário do banco da disciplina não tem permissão para criá-las. O `migrate dev` ainda precisaria criar um banco temporário — permissão que você também não tem.

O nosso fluxo é o oposto: o banco manda, o código obedece.

---

## Parte 4 — O serviço de banco e a primeira rota

### 4.1 Gerar os arquivos

```powershell
npx nest g module prisma
npx nest g service prisma --no-spec
```

> `nest g` (de *generate*) cria arquivos já com o decorator correto **e registra o módulo no `app.module.ts` automaticamente**. `--no-spec` pula a criação do arquivo de teste — testes automatizados serão assunto de outra aula.

### 4.2 O PrismaService

Substitua `src/prisma/prisma.service.ts`:

```ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';

function paraUrlDoDriver(url: string): string {
  return url.replace(/^mysql:\/\//, 'mariadb://');
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaMariaDb(
        paraUrlDoDriver(config.getOrThrow<string>('DATABASE_URL')),
      ),
      omit: {
        user: { senha: true },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado ao banco de dados');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Desconectado do banco de dados');
  }
}
```

Três coisas acontecem aqui, e todas valem entender.

**A função `paraUrlDoDriver`.** O driver `mariadb` só aceita connection strings que comecem com `mariadb://`. A CLI do Prisma exige `mysql://`. O mesmo banco, dois formatos, dependendo de quem lê. Poderíamos manter duas variáveis de ambiente — e viver com o risco de alguém trocar a senha em só uma delas. Preferimos uma única `DATABASE_URL` e a conversão num ponto só.

**O `omit`.** Isto faz com que **nenhuma consulta** a `user`, em lugar nenhum da aplicação, devolva o campo `senha`. Filtrar no controller exigiria acertar todos os caminhos; omitir aqui exige acertar a única exceção — o login, que vai pedir explicitamente o contrário.

**Os hooks de ciclo de vida.** O `$connect()` faz a conexão acontecer **no start**, não na primeira requisição. Sem ele, uma senha errada no `.env` só apareceria quando o primeiro usuário chamasse a API, como um 500 confuso. O `$disconnect()` fecha o pool no encerramento — num banco compartilhado pela turma, deixar conexões penduradas a cada reinício esgota o limite do servidor.

### 4.3 O módulo global

`src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> `@Global()` evita ter que importar este módulo em cada módulo de negócio. É um recurso a ser usado com moderação — infraestrutura compartilhada, com uma única instância na aplicação inteira, é um dos poucos casos em que ele se justifica.

### 4.4 A rota de saúde

```powershell
npx nest g module health
npx nest g controller health --no-spec
```

`src/health/health.controller.ts`:

```ts
import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

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
```

O `SELECT 1` é o ponto. Sem ele, `/health` responderia **200 com o banco fora do ar** — pior do que não ter health check nenhum, porque dá confiança falsa. Com ele:

| Situação | Resposta |
|---|---|
| API e banco funcionando | `200` · `{ status: "ok", database: "up" }` |
| API de pé, banco inacessível | `503` · `{ status: "erro", database: "down" }` |

### 4.5 Testar

```powershell
npm run start:dev
```

No log você deve ver `Conectado ao banco de dados`. Depois:

```powershell
curl http://localhost:3000/health
```

> `curl` faz uma requisição HTTP pelo terminal. Deve voltar o JSON com `"database":"up"`.

**Teste de falha:** troque a senha na `DATABASE_URL` por algo errado e suba de novo. A aplicação deve falhar **no start**, com erro de autenticação. É o `$connect()` no `onModuleInit` fazendo o trabalho dele.

---

## Parte 5 — CRUD de usuários

Agora a primeira funcionalidade de verdade. Ainda **sem login** — as permissões entram na Parte 7.

### 5.1 Instalar o bcrypt

```powershell
npm i --save-exact bcrypt@6.0.0
npm i -D --save-exact @types/bcrypt@6.0.0
```

> `bcrypt` é a biblioteca que transforma a senha num hash. O segundo pacote traz só a tipagem TypeScript, porque o `bcrypt` é escrito em C++ e não vem com tipos — daí o `-D`.

**O que é um hash e por que ele importa.** Um hash é um caminho de mão única: da senha se chega ao hash, do hash não se volta à senha. Guardamos o hash. Quando alguém tenta entrar, calculamos o hash do que foi digitado e comparamos com o guardado.

Consequência prática: se o banco vazar, o atacante não tem as senhas. E nem você tem — um sistema que consegue lhe mostrar a senha de um usuário é um sistema mal feito.

### 5.2 Gerar os arquivos

```powershell
npx nest g module users
npx nest g service users --no-spec
npx nest g controller users --no-spec
```

### 5.3 Um validador para o nosso banco

Crie `src/common/validators/eh-latin1.validator.ts`:

```ts
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function EhLatin1(options?: ValidationOptions) {
  return function (objeto: object, propriedade: string): void {
    registerDecorator({
      name: 'ehLatin1',
      target: objeto.constructor,
      propertyName: propriedade,
      options,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') return true;
          return [...valor].every((c) => c.charCodeAt(0) <= 255);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contem caracteres que o banco nao consegue armazenar (emoji ou simbolos fora do latin1)`;
        },
      },
    });
  };
}
```

**Por que isso existe.** As colunas do banco usam `latin1`, e o MySQL está em modo estrito. Um emoji no nome geraria o erro `1366 — Incorrect string value` lá no banco, e o usuário receberia um **500** sem explicação. Com o validador, recebe um **400** dizendo o que houve.

Pela mesma razão, os `@MaxLength` dos DTOs batem exatamente com os `VARCHAR` do banco.

### 5.4 Um helper de data

`src/common/helpers/data.ts`:

```ts
export function paraDataUtc(valor?: string): Date | undefined {
  if (!valor) return undefined;
  return new Date(`${valor}T00:00:00.000Z`);
}
```

> O `Z` no final força UTC. Sem isso, a data seria interpretada no fuso local — e como o Brasil está em UTC-3, a coluna `DATE` gravaria o **dia anterior**. Um erro que ninguém percebe até alguém reparar que toda a base nasceu um dia antes.

### 5.5 O DTO de cadastro

`src/users/dto/create-user.dto.ts`:

```ts
import {
  IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';

import { EhLatin1 } from '../../common/validators/eh-latin1.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'nome e obrigatorio' })
  @MaxLength(120)
  @EhLatin1()
  nome!: string;

  @IsEmail({}, { message: 'email deve ser um endereco valido' })
  @MaxLength(150)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'senha deve ter no minimo 8 caracteres' })
  @MaxLength(72, { message: 'senha deve ter no maximo 72 caracteres (limite do bcrypt)' })
  senha!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dataNascimento deve estar no formato AAAA-MM-DD' })
  dataNascimento?: string;

  @IsOptional() @IsString() @MaxLength(20) @EhLatin1()
  rg?: string;

  @IsOptional() @IsString() @MaxLength(20) @EhLatin1()
  cpf?: string;

  @IsOptional() @IsString() @MaxLength(255) @EhLatin1()
  nomeMae?: string;
}
```

**Pare e repare no que NÃO está aqui: o campo `role`.**

Essa ausência é a decisão de segurança mais importante do projeto inteiro. A rota de cadastro é pública. Se `role` estivesse no DTO, qualquer pessoa se cadastraria como administrador.

E lembra do `forbidNonWhitelisted` da Parte 2? É ele que faz `"role": "admin"` no corpo devolver **400** — o campo é recusado com mensagem, não ignorado em silêncio.

**Sobre o limite de 72 caracteres:** não é número redondo escolhido a esmo. O bcrypt ignora tudo depois do 72º byte. Sem esse limite, uma senha de 80 caracteres e os seus 72 primeiros seriam a mesma senha — e ninguém notaria.

### 5.6 O DTO de atualização

`src/users/dto/update-user.dto.ts` tem os mesmos campos, todos opcionais, **mais** o `role`:

```ts
  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'role deve ser "user" ou "admin"' })
  role?: string;
```

> Aqui o `role` existe porque um administrador precisa poder promover alguém. Quem impede o usuário comum de usá-lo é o service, na Parte 7 — a regra depende de **quem** está pedindo, não do formato do payload.

### 5.7 O service

`src/users/users.service.ts` (trecho central):

```ts
const CUSTO_BCRYPT = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: await bcrypt.hash(dto.senha, CUSTO_BCRYPT),
          dataNascimento: paraDataUtc(dto.dataNascimento),
          rg: dto.rg,
          cpf: dto.cpf,
          nomeMae: dto.nomeMae,
          role: 'user',
        },
      });
    } catch (erro) {
      throw this.traduzirErro(erro);
    }
  }

  listar() {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.user.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario ${id} nao encontrado`);
    return usuario;
  }

  buscarPorEmailComSenha(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { senha: false },
    });
  }

  private traduzirErro(erro: unknown, id?: number): Error {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        return new ConflictException('Ja existe um usuario com este email ou cpf');
      }
      if (erro.code === 'P2025') {
        return new NotFoundException(`Usuario ${id} nao encontrado`);
      }
    }
    return erro instanceof Error ? erro : new Error(String(erro));
  }
}
```

Pontos a observar:

**`role: 'user'` fixo.** Não vem do cliente (não está no DTO) e não fica por conta do banco, cujo default é `'admin'`. Duas camadas para a mesma proteção.

**Custo 12 no bcrypt.** Cada ponto a mais **dobra** o tempo de cálculo. 12 é o equilíbrio atual entre resistir a força bruta e não deixar o login lento.

**`buscarPorEmailComSenha` com `omit: { senha: false }`.** É o único ponto da aplicação que lê o hash. A omissão global continua valendo em todo o resto.

**`traduzirErro`.** Sem ela, um email duplicado viraria um 500 com a mensagem crua do Prisma — que vaza nome de tabela e de índice. Com ela, vira um **409 Conflict** legível.

### 5.8 O controller

```ts
@Controller('user')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  listar() { return this.users.listar(); }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.users.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CreateUserDto) { return this.users.criar(dto); }
}
```

> `ParseIntPipe` converte o `:id` da URL — que chega sempre como texto — para número, e devolve **400** se não for um número válido. Sem ele, `/user/abc` chegaria ao Prisma como string e geraria um erro interno.

### 5.9 Testar

```powershell
curl -X POST http://localhost:3000/user -H "Content-Type: application/json" -d "{\"nome\":\"Maria Silva\",\"email\":\"maria.SEUNOME@exemplo.com\",\"senha\":\"senha12345\"}"
```

> Como o banco é compartilhado pela turma e `email` é UNIQUE, **use suas iniciais ou matrícula** no email. Senão o segundo aluno a testar recebe um 409 e acha que é bug do próprio código.

| Teste | Esperado |
|---|---|
| Cadastro válido | `201`, e o `role` volta como `"user"` |
| `GET /user` | `200`, e **nenhum registro traz o campo `senha`** |
| Cadastrar o mesmo email de novo | `409` |
| Enviar `"role":"admin"` no corpo | `400` |
| `senha` com 5 caracteres | `400` |
| Nome com emoji | `400` |

Os quatro últimos são os que provam que as validações funcionam.

---

## Parte 6 — Login e token

### 6.1 Instalar

```powershell
npm i --save-exact @nestjs/jwt@12.0.2
```

> Módulo oficial do Nest para assinar e verificar tokens JWT.

**O que é um JWT.** É um texto com três partes separadas por ponto: cabeçalho, dados e assinatura. Os dados **não são secretos** — qualquer um consegue lê-los. O que a assinatura garante é que ninguém os **alterou**, porque só quem tem o `JWT_SECRET` consegue assinar.

Por isso o segredo é tão importante: quem o descobrir fabrica tokens válidos com o conteúdo que quiser, inclusive `role: admin`.

### 6.2 Gerar os arquivos

```powershell
npx nest g module auth
npx nest g service auth --no-spec
npx nest g controller auth --no-spec
npx nest g guard auth/guards/jwt-auth --no-spec --flat
npx nest g decorator auth/decorators/public --flat
```

> `--flat` impede que o CLI crie uma subpasta extra com o nome do arquivo.
>
> **Não usamos Passport neste projeto.** Para um único fluxo de JWT, um guard próprio tem menos dependências e deixa a verificação do token visível no código — que é justamente o que queremos ensinar.

### 6.3 O tipo do usuário autenticado

`src/auth/tipos/usuario-autenticado.ts`:

```ts
export interface UsuarioAutenticado {
  sub: number;
  email: string;
  role: string;
}

export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
```

> `sub` (de *subject*) é o nome padronizado para "quem é o dono deste token".

### 6.4 O decorator @Public

`src/auth/decorators/public.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';

export const CHAVE_PUBLICA = 'rotaPublica';

export const Public = () => SetMetadata(CHAVE_PUBLICA, true);
```

### 6.5 O guard

`src/auth/guards/jwt-auth.guard.ts`:

```ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const ehPublica = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (ehPublica) return true;

    const requisicao = contexto.switchToHttp().getRequest();
    const token = this.extrairToken(requisicao);

    if (!token) {
      throw new UnauthorizedException('Token nao informado. Use o cabecalho Authorization: Bearer <token>');
    }

    try {
      requisicao.user = await this.jwt.verifyAsync<UsuarioAutenticado>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    return true;
  }

  private extrairToken(requisicao: Request): string | undefined {
    const cabecalho = requisicao.headers.authorization;
    if (!cabecalho) return undefined;
    const [tipo, token] = cabecalho.split(' ');
    return tipo === 'Bearer' ? token : undefined;
  }
}
```

Duas escolhas de projeto aqui:

**`getAllAndOverride`** olha primeiro o método e depois a classe. Assim um `@Public()` num método vence a configuração do controller inteiro.

**A mensagem de erro é genérica de propósito.** Dizer "token expirado" versus "assinatura inválida" entrega informação útil a quem está atacando.

### 6.6 O service de autenticação

```ts
const HASH_FALSO = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7g3KJx1lqPpVQZVZ4YJ0sOZ4Zq0ZqZq';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.users.buscarPorEmailComSenha(dto.email);

    const senhaConfere = await bcrypt.compare(dto.senha, usuario?.senha ?? HASH_FALSO);

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    const payload: UsuarioAutenticado = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role ?? ROLE_USER,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      token_type: 'Bearer',
      expires_in: this.config.getOrThrow<string>('JWT_EXPIRES_IN'),
    };
  }
}
```

**O detalhe mais sutil do projeto inteiro está aqui: o `HASH_FALSO`.**

A mensagem de erro é a mesma nos dois casos — email inexistente e senha errada — para não entregar quem tem conta. Mas isso não basta. Sem o hash falso, o email inexistente responderia **na hora**, enquanto o email existente com senha errada demoraria os ~200 ms do bcrypt.

Essa diferença de tempo é mensurável, e permite descobrir exatamente quais emails estão cadastrados. Comparando sempre contra algum hash, os dois casos levam o mesmo tempo.

Chama-se **ataque de temporização**. É o tipo de coisa que não aparece em teste funcional nenhum.

### 6.7 O controller

```ts
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
```

> `@HttpCode(200)` porque o padrão do Nest para `POST` é **201 Created** — e aqui não se cria recurso nenhum, apenas se autentica.

### 6.8 O módulo, e a decisão central

```ts
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as DuracaoToken,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
```

> `registerAsync` porque o segredo vem do `ConfigService`, que só existe depois que o `ConfigModule` validou o `.env`.

**`APP_GUARD` registra o guard globalmente.** Por padrão, **tudo** passa a exigir token. As rotas abertas são marcadas com `@Public()`.

Essa inversão é deliberada. Esquecer de proteger uma rota não deixa buraco aberto; esquecer de liberar uma rota pública aparece no primeiro teste, como um 401 óbvio. O contrário — proteger caso a caso — falha em **silêncio**, que é o pior modo de falhar em segurança.

Agora marque como `@Public()` as quatro rotas abertas de usuários: `GET /user`, `GET /user/:id`, `POST /user` e, claro, o `POST /login`.

### 6.9 Testar

```powershell
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"email\":\"maria.SEUNOME@exemplo.com\",\"senha\":\"senha12345\"}"
```

| Teste | Esperado |
|---|---|
| Login correto | `200` com `access_token` |
| Senha errada | `401` |
| Email inexistente | `401` — **com a mesma mensagem** |
| Rota protegida sem token | `401` |
| Token com um caractere alterado | `401` |

Cole o token em [jwt.io](https://jwt.io) e veja o conteúdo. Ele é legível — e é por isso que **nunca** se coloca informação sensível dentro de um JWT.

---

## Parte 7 — Permissões

Duas regras de natureza diferente, dois mecanismos.

| Tipo de regra | Exemplo | Onde verificar |
|---|---|---|
| Depende só do **perfil** | `DELETE /user/:id` exige admin | Guard |
| Depende do **registro** | `PUT /address/:id` exige ser dono *daquele* endereço | Service |

**Por que não tudo em guard:** para `/address/:id`, descobrir o dono exige carregar o endereço do banco — e o service vai carregá-lo de qualquer forma. Um guard faria uma segunda consulta para saber a mesma coisa.

**Por que não tudo no service:** para `DELETE /user/:id`, o perfil já vem no token. Ir ao banco para negar algo que o token sozinho já nega é trabalho jogado fora.

Regra prática: **guard quando a informação já está no token; service quando precisa do registro.**

### 7.1 Gerar

```powershell
npx nest g guard auth/guards/roles --no-spec --flat
npx nest g decorator auth/decorators/roles --flat
npx nest g decorator auth/decorators/usuario-atual --flat
```

### 7.2 O decorator de usuário

`src/auth/decorators/usuario-atual.decorator.ts`:

```ts
export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    return contexto.switchToHttp().getRequest().user;
  },
);
```

> Injeta o usuário do token direto no parâmetro do método, evitando `@Req() req` e acessos a `req.user` sem tipagem espalhados pelo código.

### 7.3 O guard de perfis

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesExigidas = this.reflector.getAllAndOverride<string[]>(CHAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!rolesExigidas?.length) return true;

    const usuario = contexto.switchToHttp().getRequest().user;

    if (!usuario || !rolesExigidas.includes(usuario.role)) {
      throw new ForbiddenException(
        `Esta operacao exige um dos perfis: ${rolesExigidas.join(', ')}`,
      );
    }

    return true;
  }
}
```

Registre-o no `AuthModule`, **depois** do `JwtAuthGuard`:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

> A ordem importa: o `JwtAuthGuard` precisa rodar primeiro, porque é ele quem preenche o `request.user` que o `RolesGuard` vai ler.

### 7.4 O helper de propriedade

`src/common/helpers/propriedade.ts`:

```ts
export function garantirDonoOuAdmin(
  usuario: UsuarioAutenticado,
  idDoDono: number,
): void {
  if (usuario.role === ROLE_ADMIN) return;
  if (usuario.sub === idDoDono) return;

  throw new ForbiddenException('Voce so pode acessar os seus proprios registros');
}

export function ehAdmin(usuario: UsuarioAutenticado): boolean {
  return usuario.role === ROLE_ADMIN;
}
```

### 7.5 Aplicar no controller de usuários

```ts
  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UsuarioAtual() solicitante: UsuarioAutenticado,
  ) {
    return this.users.atualizar(id, dto, solicitante);
  }

  @Roles(ROLE_ADMIN)
  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.users.remover(id);
  }
```

E no service:

```ts
  async atualizar(id: number, dto: UpdateUserDto, solicitante: UsuarioAutenticado) {
    garantirDonoOuAdmin(solicitante, id);

    if (dto.role !== undefined && !ehAdmin(solicitante)) {
      throw new ForbiddenException(
        'Somente um administrador pode alterar o perfil de acesso',
      );
    }
    // ...
  }
```

### 7.6 A brecha que quase passou

Olhe de novo para aquelas quatro linhas do `role`.

`PUT /user/:id` é acessível ao próprio usuário — parece inofensivo, é só "editar meu cadastro". Mas **um dos campos do cadastro é o nível de acesso**. Sem essa checagem, qualquer pessoa se promoveria a administrador editando o próprio perfil.

Vale guardar o padrão: sempre que uma regra disser "o usuário pode editar os próprios dados", pergunte **quais** dados. Se algum deles controla permissão, preço, saldo ou status, a regra precisa de exceção.

### 7.7 Criar o primeiro administrador

`POST /user` sempre cria com `role = 'user'`, de propósito. Então o primeiro admin nasce fora da API.

```powershell
node -e "console.log(require('bcrypt').hashSync('SuaSenhaForte123', 12))"
```

> Gera o hash da senha. O MySQL não tem função bcrypt, então o cálculo precisa acontecer aqui e o resultado ser colado no `INSERT`.

No HeidiSQL:

```sql
INSERT INTO usuarios (nome, email, senha, role, createdAt, updatedAt)
VALUES (
  'Admin SUAS INICIAIS',
  'admin.suas-iniciais@exemplo.com',
  'COLE_AQUI_O_HASH',
  'admin',
  NOW(), NOW()
);
```

Repare no que este exercício demonstra: a senha **nunca** aparece em texto puro, nem no script. E criar administrador não é — nem deve ser — uma rota da API.

### 7.8 Testar as permissões

Os testes que **devem falhar** são os importantes aqui:

| Teste | Esperado |
|---|---|
| Usuário comum em `DELETE /user/:id` | `403` |
| Usuário comum mandando `"role":"admin"` num `PUT` do próprio cadastro | `403` |
| Admin fazendo as duas operações acima | `200` |
| `POST /user` com `"role":"admin"` | `400` |

---

## Parte 8 — Endereços e contatos

### 8.1 Gerar

```powershell
npx nest g module addresses
npx nest g service addresses --no-spec
npx nest g controller addresses --no-spec
```

> Os módulos têm nome plural em inglês, mas a **rota** é `/address`, singular — porque foi assim que a especificação pediu. Quem define a rota é o `@Controller('address')`; o nome da pasta não influencia.

### 8.2 O detalhe que exige atenção

O parâmetro da rota **muda de significado conforme o método HTTP**:

```
GET    /address/:idUser   ->  id do USUÁRIO   (liste os endereços dele)
POST   /address/:idUser   ->  id do USUÁRIO   (crie um endereço para ele)
PUT    /address/:id       ->  id do ENDEREÇO  (altere este endereço)
DELETE /address/:id       ->  id do ENDEREÇO  (remova este endereço)
```

É válido em HTTP — o roteamento distingue pelo método — mas confunde quem lê depois. Duas providências: os parâmetros têm **nomes diferentes** (`idUser` e `id`), e há um comentário no topo do controller explicando a convenção.

A consequência prática está na verificação de acesso:

| Rota | Como descobrir o dono |
|---|---|
| `GET`/`POST` `/address/:idUser` | O parâmetro **é** o dono — checa direto |
| `PUT`/`DELETE` `/address/:id` | Precisa **carregar o endereço** para saber de quem é |

```ts
  // O parâmetro já é o dono
  listarPorUsuario(idUsuario: number, solicitante: UsuarioAutenticado) {
    garantirDonoOuAdmin(solicitante, idUsuario);
    return this.prisma.address.findMany({
      where: { idUsuario },
      orderBy: { id: 'asc' },
    });
  }

  // Aqui o dono só é conhecido depois de carregar o registro
  async atualizar(id: number, dto: UpdateAddressDto, solicitante: UsuarioAutenticado) {
    const endereco = await this.buscarOuFalhar(id);
    garantirDonoOuAdmin(solicitante, endereco.idUsuario);
    return this.prisma.address.update({ where: { id }, data: dto });
  }
```

> Se o registro não existir, vem **404** antes de qualquer checagem de permissão.

### 8.3 Usuário inexistente

Criar endereço para um usuário que não existe viola a chave estrangeira. O Prisma devolve **P2003**:

```ts
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2003') {
        throw new NotFoundException(`Usuario ${idUsuario} nao encontrado`);
      }
      throw erro;
    }
```

> Poderíamos consultar antes se o usuário existe. Deixar o banco responder é uma consulta a menos e não tem janela de corrida entre a checagem e a inserção.

### 8.4 Validações

| Campo | Regra | Por quê |
|---|---|---|
| `cep` | 8 dígitos, com ou sem hífen | Aceita `20031-170` e `20031170` |
| `estado` | exatamente 2 letras maiúsculas | A coluna é `VARCHAR(2)` |
| `numeroTelefone` | dígitos, espaços, parênteses, `+` e `-` | Permissivo de propósito: número internacional é legítimo |

### 8.5 Contatos — seu exercício

**Contatos é igual a endereços, com um campo só.** Faça sozinho:

```powershell
npx nest g module contacts
npx nest g service contacts --no-spec
npx nest g controller contacts --no-spec
```

Rotas: `/contact/:idUser` para `GET` e `POST`, `/contact/:id` para `PUT` e `DELETE`. Campo único: `numeroTelefone`, `VARCHAR(30)`.

Refazer a mesma estrutura logo depois de entendê-la é o que transforma "eu vi isso" em "eu sei fazer isso".

---

## Parte 9 — Tornando a API robusta

Três camadas que não mudam funcionalidade nenhuma, mas mudam o que acontece **quando algo dá errado**.

### 9.1 Cabeçalhos de segurança

```powershell
npm i --save-exact helmet@8.3.0
```

> Middleware que adiciona cabeçalhos HTTP de segurança (CSP, X-Frame-Options, HSTS e outros). Uma linha que fecha uma família inteira de problemas conhecidos.

No `main.ts`, antes de tudo:

```ts
app.use(helmet());
```

### 9.2 Limite de tentativas no login

```powershell
npm i --save-exact @nestjs/throttler@6.7.0
```

> Limitador de requisições por IP.

```ts
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @Post('login')
```

> Cinco tentativas por minuto, por IP, **apenas no login**. É a única rota em que tentativa repetida é sinal de ataque; limitar a API inteira atrapalharia uso legítimo sem ganho proporcional.
>
> O efeito é desproporcional ao esforço: um ataque de força bruta que levaria minutos passa a levar anos.
>
> `ttl` é em **milissegundos** a partir da versão 5 — em versões anteriores era em segundos. Mais um caso de exemplo antigo da internet que não funciona mais.

### 9.3 Tradução dos erros do Prisma

```powershell
npx nest g filter common/filters/prisma-exception --no-spec --flat
```

> Cria um *exception filter*: uma classe que intercepta exceções de um tipo específico e decide qual resposta HTTP devolver.

```ts
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(erro: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();
    const { status, mensagem } = this.traduzir(erro);

    this.logger.warn(`Prisma ${erro.code}: ${erro.message.split('\n').pop()}`);

    resposta.status(status).json({ statusCode: status, message: mensagem, error: erro.code });
  }
  // traduzir(): P2002 -> 409, P2003 -> 400, P2025 -> 404, resto -> 500
}
```

Registre no `AppModule`:

```ts
providers: [{ provide: APP_FILTER, useClass: PrismaExceptionFilter }],
```

**Repare na última linha do `catch`.** A stack completa vai para o **log do servidor**; o cliente recebe só a mensagem traduzida. Quem opera a API precisa do detalhe; quem a consome, não — e mandar a stack do Prisma na resposta vaza nome de tabela, de coluna e de índice.

---

## Parte 10 — Documentação e verificação final

### 10.1 Instalar

```powershell
npm i --save-exact @nestjs/swagger@12.0.1
```

> Gera a especificação OpenAPI a partir dos decorators e serve a interface do Swagger UI.

No `nest-cli.json`:

```json
"compilerOptions": {
  "deleteOutDir": true,
  "plugins": ["@nestjs/swagger"]
}
```

> O plugin lê os DTOs em tempo de compilação e gera a documentação de cada campo **sozinho**, a partir dos tipos TypeScript e dos decorators do `class-validator`. Sem ele, cada campo precisaria de um `@ApiProperty` escrito à mão — dezenas de linhas repetindo o que já está declarado ao lado.

### 10.2 Configurar no main.ts

```ts
const config = new DocumentBuilder()
  .setTitle('NodeNestPrisma API')
  .setDescription('CRUD de usuarios, enderecos e contatos com JWT e RBAC.')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const documento = SwaggerModule.createDocument(app, config);

SwaggerModule.setup('docs', app, documento, {
  swaggerOptions: { persistAuthorization: true },
});
```

> `.addBearerAuth()` adiciona o botão **Authorize** (cadeado) no topo da página — sem ele não há como testar rota protegida pela interface. `persistAuthorization` mantém o token preenchido depois de recarregar a página; sem isso, cada F5 obriga a colar o token de novo.

### 10.3 Documentar os erros de permissão

`src/common/decorators/api-autenticacao.decorator.ts`:

```ts
export function ApiAutenticacao() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: 'Token ausente, invalido ou expirado' }),
    ApiResponse({ status: 403, description: 'Autenticado, mas sem permissao para este recurso' }),
  );
}
```

> `applyDecorators` combina vários decorators num só. Aplicado na **classe** do controller, vale para todos os métodos dele — em vez de repetir três linhas em cada um e esquecer em algum.

Uma documentação que só mostra o caminho feliz esconde justamente a parte mais difícil de entender da API.

### 10.4 Roteiro de verificação final

Abra `http://localhost:3000/docs` e percorra:

1. `POST /login` com o admin da Parte 7 → copie o `access_token`
2. **Authorize** → cole o token
3. `GET /user` → `200`, e confirme que **nenhum registro traz `senha`**
4. `POST /user` com `"role":"admin"` no corpo → **400**
5. `POST /user` válido → `201`, e o `role` volta como `"user"`
6. Faça login com esse novo usuário e troque o token
7. `DELETE /user/:id` → **403**
8. `GET /address/:idDeOutroUsuario` → **403**
9. `GET /address/:seuProprioId` → `200`
10. Volte ao token de admin e repita 7 e 8 → **200** nos dois

**Os passos que devem falhar são os mais importantes.** Uma API que faz o caminho feliz mas não bloqueia o resto não está pronta — está apenas não testada.

---

## Apêndice — Erros comuns

### `TS5011: The 'rootDir' setting must be explicitly set`

O TypeScript 6 não deduz mais o `rootDir`. Adicione `"rootDir": "./src"` ao `tsconfig.json`.

### `TS5101: Option 'baseUrl' is deprecated`

Remova o `baseUrl` do `tsconfig.json`. Existe a opção de silenciar com `"ignoreDeprecations": "6.0"` — **não faça isso**: só adia o problema para o dia em que o TypeScript 7 chegar e o projeto parar de compilar de vez.

### `P1012: The datasource property 'url' is no longer supported`

No Prisma 7 a `url` saiu do `schema.prisma` e vive só no `prisma.config.ts`. O bloco `datasource` deve ter **apenas** o `provider`.

Este erro aparece muito porque quase todo tutorial disponível hoje ainda mostra a sintaxe antiga.

### A API reinicia sozinha, em loop

Você ativou `"incremental": true` no `tsconfig.json`. Ela grava um arquivo de cache na raiz, o observador detecta como mudança, recompila, grava de novo — e o ciclo se alimenta.

Remova a opção. O `nest start --watch` já faz compilação incremental em memória.

Se persistir, desconfie do OneDrive ou do Google Drive: a sincronização reescreve arquivos e atualiza a data de modificação, o que o observador lê como alteração. Mantenha projetos de código fora de pastas sincronizadas.

### `Cannot find module '../generated/prisma/client'`

Falta rodar `npm run prisma:generate`. A pasta `src/generated/` está no `.gitignore` — quem clona o projeto precisa gerá-la.

### `Error: 1366 Incorrect string value`

Você mandou um caractere que a coluna `latin1` não armazena, quase sempre um emoji. É o que o validador `EhLatin1` previne.

### `409 Conflict` ao cadastrar

`email` e `cpf` são UNIQUE, e **o banco é compartilhado pela turma**. Alguém já usou esse valor. Prefixe seus dados de teste com suas iniciais ou matrícula.

### `npm install` muito lento ou com erro de arquivo travado

O projeto está numa pasta sincronizada (OneDrive, Google Drive). A sincronização tenta acompanhar as dezenas de milhares de arquivos de `node_modules` — que é conteúdo descartável, reconstruído a partir do `package-lock.json`.

Exclua `node_modules` da sincronização, ou mova o projeto para algo como `C:\dev\`.

---

## Encerramento

O que ficou pronto:

- CRUD completo de três recursos relacionados
- autenticação por token, com senha em hash
- controle de acesso por perfil e por propriedade do registro
- validação de entrada alinhada às restrições reais do banco
- tratamento de erro que não vaza estrutura interna
- documentação interativa que serve de ferramenta de teste

E, mais importante que a lista acima, alguns hábitos: fixar versões, falhar cedo, negar por padrão, e ler a mensagem de erro antes de tentar sorte.

### Para continuar

- **Testes automatizados** — transformar o roteiro da Parte 10 em código que roda sozinho
- **Refresh token** — para não obrigar o usuário a refazer login a cada hora
- **Paginação** no `GET /user` — hoje ele devolve a tabela inteira
- **Logs estruturados** e observabilidade
