# NodeNestPrisma

API REST em **NestJS 12** e **Prisma 7** sobre **MySQL 5.7**, com CRUD de usuários, endereços e contatos, autenticação JWT e controle de acesso por perfil.

Projeto didático da disciplina de Tecnologias Web — o material completo de construção está em [`docs/PASSO-A-PASSO.md`](./docs/PASSO-A-PASSO.md).

---

## Stack

| Ferramenta | Versão | Observação |
|---|---|---|
| Node.js | 24.x LTS | ver `.nvmrc` |
| NestJS | 12.0.3 | |
| TypeScript | 6.0.3 | **não** use a 7.x — o Nest 12 é validado com a linha 6 |
| Prisma | 7.10.0 | versão exata: `latest` no npm é um RC sem suporte a MySQL |
| MySQL | 5.7.30 | tabelas pré-existentes, sem migrations |
| bcrypt | 6.0.0 | hash das senhas, custo 12 |

Todas as dependências estão fixadas sem `^`. Num projeto replicado por uma turma ao longo de um semestre, a diferença entre `12.0.3` e `^12.0.3` é a diferença entre um erro reproduzível e um erro que só acontece na máquina de uma pessoa.

---

## Como rodar

```bash
# 1. dependências
npm ci

# 2. configuração
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# preencha DATABASE_URL e JWT_SECRET

# 3. gerar o Prisma Client (obrigatório: src/generated/ não é versionado)
npm run prisma:generate

# 4. subir
npm run start:dev
```

API em `http://localhost:3000` · documentação interativa em `http://localhost:3000/docs`.

> **`node_modules` nunca é copiado entre máquinas.** O `bcrypt` tem binário nativo por sistema operacional — em cada máquina, rode a instalação localmente.
>
> **Evite pastas sincronizadas** (OneDrive, Google Drive). A sincronização tenta acompanhar as dezenas de milhares de arquivos de `node_modules`, o que causa lentidão, travas durante o `npm install` e reinícios espúrios no modo `--watch`.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe com recompilação automática |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Executa o build |
| `npm run prisma:generate` | Gera o Prisma Client a partir do schema |
| `npm run prisma:pull` | Reescreve o schema a partir do banco (sobrescreve) |
| `npm run prisma:check` | Compara schema e banco, sem alterar nada |
| `npm run prisma:studio` | Abre o navegador de dados do Prisma |

### Sobre o `prisma:check`

Ele **sempre** retorna 2 neste projeto, e isso está correto. Há duas divergências propositais entre o schema e o banco:

| Divergência | Motivo |
|---|---|
| `createdAt` tem `@default(now())` no schema e nenhum default no banco | As colunas são `NOT NULL` sem default. Quem preenche é o Prisma — sem isso, todo `INSERT` falharia |
| `role` é `"user"` no schema e `'admin'` no banco | O default do banco criaria administradores pelo cadastro público. A aplicação nunca deixa esse default agir |

Use o comando comparando com esse baseline: **qualquer linha além dessas quatro** indica alteração real na estrutura do banco.

---

## Rotas

| Método | Rota | Acesso |
|---|---|---|
| `POST` | `/login` | aberto |
| `GET` | `/user` · `/user/:id` | aberto (sem a senha) |
| `POST` | `/user` | aberto (perfil sempre `user`) |
| `PUT` | `/user/:id` | admin ou o próprio usuário |
| `DELETE` | `/user/:id` | somente admin |
| `GET` `POST` | `/address/:idUser` · `/contact/:idUser` | admin ou o dono |
| `PUT` `DELETE` | `/address/:id` · `/contact/:id` | admin ou o dono do registro |
| `GET` | `/health` | aberto |

> Atenção ao parâmetro de `/address` e `/contact`: em `GET` e `POST` ele é o **id do usuário**; em `PUT` e `DELETE`, o **id do registro**.

---

## Primeiro administrador

`POST /user` sempre cria com perfil `user`, de propósito — a rota é pública e não pode ser porta de entrada para virar admin. O primeiro administrador nasce fora da API:

```bash
node scripts/gerar-hash.js "SuaSenhaForte"
# cole o hash em scripts/seed-admin.sql e execute no seu cliente MySQL
```

---

## Decisões de arquitetura

**Sem migrations.** As tabelas já existem, estão populadas e o usuário do banco não tem permissão para criá-las. O fluxo é de introspecção: `prisma db pull` lê o banco e o código se adapta.

**Sem Passport.** Para um único fluxo de JWT, um guard próprio sobre `@nestjs/jwt` tem menos dependências e deixa a verificação do token visível — o que importa num projeto didático.

**Sem Nodemon.** O `nest start --watch` já faz isso.

**Guard global, liberação explícita.** Por padrão toda rota exige token; as abertas são marcadas com `@Public()`. Esquecer de proteger não deixa buraco aberto — esquecer de liberar aparece como 401 no primeiro teste.

**Senha omitida globalmente.** O `PrismaService` é configurado com `omit: { user: { senha: true } }`. Nenhuma consulta devolve o hash; o login pede a exceção explicitamente. Filtrar no controller exigiria acertar todos os caminhos — omitir globalmente exige acertar a única exceção.

**Perfil verificado em guard, propriedade verificada no service.** Quando a informação já está no token (o perfil), um guard resolve. Quando depende do registro (quem é o dono daquele endereço), a verificação fica no service, que já vai carregá-lo de qualquer forma.

---

## Aviso sobre dados pessoais

As tabelas guardam CPF, RG e nome da mãe, e `GET /user` é público por especificação do exercício. Isso é aceitável **apenas** porque o ambiente é de estudo e os dados são fictícios.

Num projeto real esses dados não podem ser expostos em rotas abertas. Uma listagem pública deveria devolver no máximo `id`, `nome` e `email`, e o tratamento de dados pessoais reais exige avaliação prévia da área de privacidade e enquadramento na LGPD.

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/PASSO-A-PASSO.md`](./docs/PASSO-A-PASSO.md) | **Material completo de construção, do zero** |
| [`docs/plano-de-desenvolvimento.md`](./docs/plano-de-desenvolvimento.md) | Plano: stack, modelagem, segurança, matriz de acesso |
| [`docs/00-convencoes.md`](./docs/00-convencoes.md) | Como o passo-a-passo é escrito |
| [`docs/fase-0-checklist.md`](./docs/fase-0-checklist.md) | Pré-requisitos de ambiente |
| [`docs/fase-1-scaffold.md`](./docs/fase-1-scaffold.md) | Estrutura, versões, validação do `.env` |
| [`docs/fase-2-prisma.md`](./docs/fase-2-prisma.md) | Introspecção e schema |
| [`docs/fase-3-prisma-service.md`](./docs/fase-3-prisma-service.md) | Conexão e health check |
| [`docs/fase-4-users.md`](./docs/fase-4-users.md) | CRUD de usuários, bcrypt, omissão da senha |
| [`docs/fase-5-auth.md`](./docs/fase-5-auth.md) | Login, JWT e guard global |
| [`docs/fase-6-rbac.md`](./docs/fase-6-rbac.md) | Perfis, propriedade e primeiro admin |
| [`docs/fase-7-8-addresses-contacts.md`](./docs/fase-7-8-addresses-contacts.md) | Endereços e contatos |
| [`docs/fase-9-robustez.md`](./docs/fase-9-robustez.md) | Erros, helmet e rate limit |
| [`docs/fase-10-swagger.md`](./docs/fase-10-swagger.md) | Documentação e verificação manual |
