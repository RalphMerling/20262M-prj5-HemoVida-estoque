# Plano de Desenvolvimento — API NestJS + Prisma + MySQL

**Projeto:** NodeNestPrisma · **Autor:** Vitor Reis · **Versão do plano:** 3 · **Data:** 17/09/2026

> Rascunho técnico sujeito à revisão humana. Versões verificadas no registry do npm e na documentação oficial em 17/09/2026.

---

## 1. Objetivo

API REST em Node.js com NestJS e Prisma (ORM) sobre MySQL, com CRUD de **Usuários**, **Endereços** e **Contatos**, autenticação por JWT e autorização por papel (RBAC).

O código final será convertido em um **passo-a-passo para alunos de ADS**. Toda decisão registrada aqui deve ser reproduzível em uma máquina limpa.

---

## 2. Restrições do ambiente (determinam o desenho da solução)

| Restrição | Consequência no plano |
|---|---|
| As 3 tabelas já existem e estão populadas | Fluxo de **introspecção** (`prisma db pull`), não de migration |
| Alunos **não têm permissão** para criar tabelas | **Nenhuma migration será criada.** Sem `migrate dev`, sem `db push`, sem shadow database |
| Todos os alunos usam **o mesmo banco** | Colisão de `email`/`cpf` é esperada — ver seção 9 |
| Dados são fictícios (ambiente de estudo) | CPF/RG podem trafegar em rotas abertas **apenas aqui** — ver seção 10 |
| Schema do banco não será alterado | Todos os ajustes são contornados **pelo lado da aplicação** — ver seção 6 |
| Testes automatizados serão ensinados depois | Fora do escopo. Verificação manual via Swagger UI |

---

## 3. Stack e versões

Fixar versões exatas. Instalar sempre com `npm ci` (nunca `npm install`) depois do primeiro setup.

| Ferramenta | Versão | Observação |
|---|---|---|
| MySQL (servidor) | **5.7.30** | Suportado pelo Prisma 7 (5.6 / 5.7 / 8.0 / 8.4). Roda em `sql_mode` estrito por padrão — ver seção 6.2 |
| Node.js | **24.x LTS (Krypton)** | Active LTS. Node 26 (mai/2026) ainda é *Current*, só vira LTS em out/2026 |
| NestJS | **12.0.x** | Lançado em 28/08/2026. ESM-first, mas CommonJS segue funcionando. Exige Node ≥ 20.11 |
| `@nestjs/cli` | 12.0.3 | |
| TypeScript | **6.0.3** | ⚠️ `npm i typescript` instala hoje a **7.0.2**. O starter oficial do Nest 12 fixa `^6.0.2`. TS 7 é a reescrita em Go e ainda não é a versão validada com os decorators do Nest |
| `prisma` + `@prisma/client` | **7.10.0 (exato, sem `^`)** | ⚠️ Duas armadilhas: a tag `latest` do pacote `prisma` aponta para **8.0.0-rc.15**, e o **Prisma 8 ainda não tem conector MySQL** (só PostgreSQL em RC, Mongo em early access, SQLite experimental). MySQL só existe na linha 7.x |
| `@nestjs/jwt` | 12.0.2 | peer aceita `@nestjs/common ^12` |
| `bcrypt` | 6.0.0 | Usa N-API (`node-addon-api` + `node-gyp-build`): binário pré-compilado único serve para Node 22/24 sem recompilar |
| `@nestjs/config` | 4.x | + validação do `.env` no boot |
| `@nestjs/swagger` | 12.x | |
| `class-validator` / `class-transformer` | 0.15.1 / 0.5.x | |
| `helmet` | 8.x | |

**Descartados:**

- **Nodemon** — o Nest já entrega `nest start --watch` (`npm run start:dev`). Adicionar Nodemon seria uma dependência redundante fazendo o que o framework já faz.
- **Passport** (`@nestjs/passport` + `passport-jwt`) — para um único fluxo de JWT, um guard próprio sobre `@nestjs/jwt` tem menos dependências e é mais didático: o aluno enxerga a validação do token acontecendo.

**Travas de replicabilidade:** `.nvmrc` com `24`, campo `engines` no `package.json`, `package-lock.json` versionado, `prisma generate` no `postinstall`.

---

## 4. Modelagem — introspecção, sem migrations

Fluxo, executado **uma única vez** por quem monta o projeto:

1. `npx prisma db pull` — lê o banco e gera o `schema.prisma`
2. Renomear os modelos para nomes limpos mantendo as tabelas originais (`@@map`)
3. **Não** gerar pasta `prisma/migrations`. O aluno recebe o `schema.prisma` pronto e roda apenas `npx prisma generate`

`db pull` e `generate` só precisam de permissão de leitura — funcionam com o usuário restrito dos alunos.

```prisma
generator client {
  provider = "prisma-client"           // gerador rust-free do Prisma 7
  output   = "../src/generated/prisma" // sai do node_modules → entra no .gitignore
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id             Int       @id @default(autoincrement())
  nome           String    @db.VarChar(120)
  email          String    @unique @db.VarChar(150)
  senha          String    @db.VarChar(120)
  dataNascimento DateTime? @db.Date
  rg             String?   @db.VarChar(20)
  cpf            String?   @unique @db.VarChar(20)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  nomeMae        String?   @default("Não informado") @map("NomeMae") @db.VarChar(255)
  role           String?   @default("user") @db.VarChar(50)

  enderecos      Address[]
  contatos       Contact[]

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
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usuario     User     @relation(fields: [idUsuario], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([idUsuario])
  @@map("enderecos")
}

model Contact {
  id             Int      @id @default(autoincrement())
  idUsuario      Int
  numeroTelefone String   @db.VarChar(30)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  usuario        User     @relation(fields: [idUsuario], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([idUsuario])
  @@map("contatos")
}
```

---

## 5. Configuração e segredos

`.env` fora do Git desde o primeiro commit; `.env.example` versionado, sem valores reais.

```
DATABASE_URL="mysql://USUARIO:SENHA@edumysql.acesso.rj.senac.br:3306/20252_tecweb3_vitorreis"
JWT_SECRET=
JWT_EXPIRES_IN=1h
PORT=3000
```

- A senha do banco precisa ir **URL-encoded** dentro da `DATABASE_URL` se tiver `@`, `:`, `/`, `#` ou `?`.
- O `.env` é validado no boot (`@nestjs/config` + schema). A aplicação **recusa subir** sem `JWT_SECRET` — melhor falhar no start do que emitir tokens com segredo vazio.
- Cada aluno gera o próprio `JWT_SECRET`.

---

## 6. Contornos pelo lado da aplicação

O banco não será alterado. Problemas e contornos:

### 6.1 `role VARCHAR(50) DEFAULT 'admin'` — falha de segurança

`POST /user` é público. Com o default do banco, **qualquer pessoa que se cadastrasse viraria admin**.

Contorno: o `CreateUserDto` **não declara** o campo `role` e o `ValidationPipe` roda com `forbidNonWhitelisted: true` — mandar `role` no corpo devolve 400. O service grava `role: 'user'` explicitamente, nunca deixando o default do banco agir. Promover alguém a admin exige um admin já existente, via `PUT /user/:id`.

### 6.2 Collation `latin1_swedish_ci`

O conector MySQL do Prisma conversa em `utf8mb4` e o MySQL converte para latin1 na gravação. Acentos do português (á, ç, õ) existem em latin1 e passam sem problema; **emoji e caracteres fora do latin1 não**.

O MySQL 5.7 roda com `sql_mode` estrito por padrão (`STRICT_TRANS_TABLES`), então um caractere não representável gera **erro 1366 (`Incorrect string value`)** em vez de gravar lixo silenciosamente. Bom para a integridade, ruim para a experiência: o aluno recebe um erro 500 críptico.

Contorno: validação nos DTOs restringindo os campos de texto a caracteres representáveis em latin1, devolvendo 400 com mensagem clara. O `sql_mode` estrito também faz string acima do `VARCHAR` declarado dar erro — daí os `@MaxLength` dos DTOs baterem exatamente com os tamanhos das colunas.

### 6.3 `createdAt` / `updatedAt` são `NOT NULL` sem default

Contorno: `@default(now())` e `@updatedAt` no schema — o Prisma preenche pelo lado do cliente. Nenhum `INSERT` sai sem esses campos.

### 6.4 `dataNascimento` é `DATE`

O driver converte para `DateTime` UTC e a data pode "andar" um dia conforme o fuso. Tratar como data pura (`YYYY-MM-DD`) no DTO e normalizar em UTC meia-noite no service.

---

## 7. Autenticação e autorização

**Fluxo:** `POST /login` com `{ email, senha }` → valida com `bcrypt.compare` → devolve `{ access_token, token_type: "Bearer", expires_in }`. As demais rotas enviam `Authorization: Bearer <token>`.

**Payload do JWT:** `{ sub: id, email, role, iat, exp }`. Validade de 1 hora. Apenas access token — sem refresh.

**Cadeia de autorização:**

1. `JwtAuthGuard` global (`APP_GUARD`) + decorator `@Public()` liberando `/login`, `GET /user`, `GET /user/:id` e `POST /user`
2. `RolesGuard` global + `@Roles('admin')` para as regras que dependem só do papel
3. **Propriedade (ownership)** verificada na camada de service, não em guard: para `/address/:id` e `/contact/:id` é preciso carregar o registro para saber quem é o dono — e o service já vai carregá-lo de qualquer modo. Um helper `assertOwnerOrAdmin(user, ownerId)` centraliza a regra e lança `ForbiddenException`

**Matriz de acesso:**

| Método | Rota | Acesso |
|---|---|---|
| POST | `/login` | aberto |
| GET | `/user` | aberto (sem senha) |
| GET | `/user/:id` | aberto (sem senha) |
| POST | `/user` | aberto (`role` forçado para `user`) |
| PUT | `/user/:id` | admin **ou** o próprio usuário |
| DELETE | `/user/:id` | admin |
| GET | `/address/:idUser` | admin **ou** dono (`idUser` = `sub` do token) |
| POST | `/address/:idUser` | admin **ou** dono |
| PUT | `/address/:id` | admin **ou** dono **do endereço** |
| DELETE | `/address/:id` | admin **ou** dono **do endereço** |
| GET | `/contact/:idUser` | admin **ou** dono |
| POST | `/contact/:idUser` | admin **ou** dono |
| PUT | `/contact/:id` | admin **ou** dono **do contato** |
| DELETE | `/contact/:id` | admin **ou** dono **do contato** |

Dois pontos que merecem comentário no código e no passo-a-passo:

- `/address/:idUser` (GET/POST) e `/address/:id` (PUT/DELETE) usam o mesmo padrão de path com significados diferentes conforme o método. É válido em HTTP, mas confunde quem lê depois.
- A `role` viaja dentro do token. Se um admin rebaixar alguém, o token antigo continua valendo até expirar. Com validade de 1h é aceitável para o exercício; a alternativa seria consultar o banco a cada requisição.

**Senhas:** já estão em hash bcrypt no banco. Novos cadastros usam `bcrypt.hash` com **cost 12**. A senha nunca sai em resposta — uso de `omit: { senha: true }` do Prisma Client 7, que vale para todas as queries do modelo (mais seguro que filtrar no controller, onde é fácil esquecer um caminho).

---

## 8. Primeiro admin de cada aluno

`POST /user` sempre cria com `role = 'user'`, de propósito. Então o primeiro admin nasce por fora da API, com um script SQL que cada aluno roda uma vez.

O hash precisa ser gerado antes, já que o MySQL não tem bcrypt:

```bash
node -e "console.log(require('bcrypt').hashSync('SENHA_ESCOLHIDA', 12))"
```

```sql
INSERT INTO usuarios (nome, email, senha, role, createdAt, updatedAt)
VALUES ('Admin <iniciais>', 'admin.<iniciais>@exemplo.com', '<hash-gerado-acima>', 'admin', NOW(), NOW());
```

Isso também vira material didático: mostra por que a senha nunca pode ser gravada em texto puro, e por que a criação de admin não é uma rota da API.

---

## 9. Banco compartilhado entre alunos

Todos os alunos apontam para o mesmo banco. `email` e `cpf` são **UNIQUE**, então dois alunos cadastrando "teste@teste.com" — o segundo recebe erro de constraint. Convenção sugerida: prefixar os dados de teste com a matrícula ou as iniciais do aluno.

Isso precisa estar documentado, ou o aluno interpreta um 409 legítimo como bug do próprio código.

Perda de dados não é preocupação: é ambiente de estudo, e registro apagado pode ser recriado.

---

## 10. Privacidade

As tabelas guardam CPF, RG e nome da mãe, e o `GET /user` é público por especificação do exercício. Isso é aceitável **apenas** porque o ambiente é de estudo e os dados são fictícios.

> **Observação obrigatória no passo-a-passo:** em um projeto real, CPF, RG e nome da mãe **não podem ser expostos em rotas abertas**. Uma listagem pública deveria devolver no máximo `id`, `nome` e `email`. Tratamento de dados pessoais reais exige avaliação prévia da área de privacidade/DPO e enquadramento na LGPD.

---

## 11. Estrutura do projeto

```
src/
  main.ts                    ValidationPipe, helmet, CORS, Swagger
  app.module.ts
  config/env.validation.ts
  prisma/
    prisma.module.ts         módulo global
    prisma.service.ts        conexão + shutdown hooks
  auth/
    auth.controller.ts       POST /login
    auth.service.ts
    dto/login.dto.ts
    guards/jwt-auth.guard.ts
    guards/roles.guard.ts
    decorators/public.decorator.ts
    decorators/roles.decorator.ts
    decorators/current-user.decorator.ts
  users/                     controller, service, module, dto
  addresses/
  contacts/
  common/
    filters/prisma-exception.filter.ts
    helpers/ownership.ts
prisma/schema.prisma         (sem pasta migrations)
scripts/seed-admin.sql       script do primeiro admin
docs/                        plano e checklists
.env  ·  .env.example  ·  .nvmrc  ·  .gitignore
```

Cada aluno cria o próprio repositório Git.

---

## 12. Swagger

`@nestjs/swagger` exposto em `/docs`:

- `DocumentBuilder` com título, descrição, versão e `addBearerAuth()`
- DTOs anotados com `@ApiProperty` (exemplos reais em cada campo)
- Controllers com `@ApiTags`, `@ApiOperation` e `@ApiResponse` — incluindo os **401 e 403 esperados**, que são o que torna a matriz de acesso visível na documentação
- `@ApiBearerAuth()` nas rotas protegidas, para o botão *Authorize* funcionar

O Swagger UI é a ferramenta de verificação manual do projeto, no lugar dos testes automatizados.

---

## 13. Fases de execução

| # | Fase | Entrega |
|---|---|---|
| 0 | Pré-requisitos | Node 24 no Windows, `.nvmrc`, teste de conexão com o MySQL do Senac |
| 1 | Scaffold | estrutura do projeto, TypeScript 6 fixado, `.gitignore`, `@nestjs/config` + validação de `.env` |
| 2 | Prisma | instalar 7.10.0 exato, `db pull`, refinar o schema, `generate` (sem migrations) |
| 3 | PrismaService | módulo global, shutdown hooks, rota `/health` |
| 4 | Users | CRUD completo, DTOs, bcrypt, `omit` da senha — ainda sem autenticação |
| 5 | Auth | `/login`, JWT, `JwtAuthGuard` global, `@Public()`, `RolesGuard` |
| 6 | RBAC em Users | aplicar a matriz de acesso + ownership; script do primeiro admin |
| 7 | Addresses | CRUD + regras de acesso |
| 8 | Contacts | CRUD + regras de acesso |
| 9 | Robustez | filtro de exceções do Prisma → HTTP, helmet, rate limit no `/login`, logs |
| 10 | Swagger | documentação completa, incluindo respostas 401/403 |
| 11 | Verificação manual | roteiro no Swagger UI cobrindo cada linha da matriz, inclusive os bloqueios esperados |
| 12 | Documentação | README e roteiro do passo-a-passo, checklist de setup em máquina limpa |

### Divisão de execução

O ambiente de automação é um Linux isolado, sem acesso à porta 3306 do Senac e com sistema operacional diferente do Windows onde o projeto vai rodar. Portanto:

- **Escrita de código e arquivos de configuração:** feita na pasta do projeto pela automação.
- **`npm install`, `npx prisma db pull`, `npx prisma generate`, `npm run start:dev` e qualquer comando que toque o banco:** executados por Vitor no Windows. O `bcrypt` compila binário nativo específico de sistema operacional — `node_modules` gerado no Linux não funciona no Windows.

---

## 14. Observações que devem constar no passo-a-passo

1. Em projeto real, CPF/RG/nome da mãe não podem ficar expostos em rotas abertas (seção 10).
2. O Nodemon não é usado porque o Nest já possui solução própria de watch (`nest start --watch`).
3. Por que `prisma` é instalado com versão exata (`7.10.0`) e não `latest` — o `latest` traz um release candidate do Prisma 8, que não suporta MySQL.
4. Por que TypeScript 6 e não 7.
5. Por que não há migrations neste projeto.
6. Por que o `role` é forçado no service e não confiado ao default do banco.
7. Convenção de dados de teste, já que o banco é compartilhado (seção 9).
8. Como o primeiro admin é criado e por que isso não é uma rota da API (seção 8).
9. `node_modules` nunca é versionado nem copiado entre máquinas — o `bcrypt` tem binário nativo por sistema operacional.
