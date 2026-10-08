# Fase 2 — Prisma

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Conectar o Prisma ao banco que **já existe**, sem criar nada nele.

---

## Arquivos criados

| Arquivo | Papel |
|---|---|
| `prisma/schema.prisma` | Descreve as três tabelas existentes |
| `prisma.config.ts` | Configuração da CLI do Prisma (inclusive o carregamento do `.env`) |

E no `package.json`, quatro scripts novos: `prisma:generate`, `prisma:pull`, `prisma:check` e `prisma:studio`.

## Dependências adicionadas

```
dependencies:     @prisma/client 7.10.0 · @prisma/adapter-mariadb 7.10.0
devDependencies:  prisma 7.10.0 · dotenv 17.4.2
```

Todas em versão exata. Sobre a `dotenv`: a versão **18.0.0** foi publicada em 17/09/2026 — no mesmo dia em que este projeto começou. Fixamos a **17.4.2**, de abril, porque estrear um *major* com horas de vida numa base que vira material de aula é risco sem contrapartida.

---

## Três descobertas que mudaram o desenho

### 1. O Prisma 7 não carrega mais o `.env` sozinho

Até a versão 6, a CLI lia o `.env` automaticamente. No 7, isso saiu do núcleo e virou responsabilidade do `prisma.config.ts` — daí a primeira linha do arquivo ser:

```ts
import 'dotenv/config';
```

Sem ela, `prisma generate` e `prisma db pull` simplesmente não enxergam `DATABASE_URL`, e o erro que aparece não aponta para a causa.

### 2. MySQL no Prisma 7 exige um *driver adapter*

O Prisma 7 removeu o motor em Rust que falava com o banco. No lugar entraram os *driver adapters* — drivers JavaScript de verdade. Para MySQL, o adaptador é o **`@prisma/adapter-mariadb`**, e ele é obrigatório: sem passá-lo ao construtor, o `PrismaClient` não conecta.

O pacote `@prisma/client` continua necessário, agora como runtime do client gerado.

### 3. O driver `mariadb` recusa `mysql://`

Esta é a armadilha menos óbvia, e foi confirmada em teste:

```
mariadb.createPool('mysql://...')
  -> erro: format must be 'mariadb://[<user>[:<password>]@]<host>[:<port>]/...'

mariadb.createPool('mariadb://...')
  -> OK
```

Mas a **CLI do Prisma exige `mysql://`**, porque é esse o `provider` declarado no schema. Ou seja: o mesmo banco precisa de dois esquemas diferentes na URL, dependendo de quem está lendo.

A saída poderia ser manter duas variáveis de ambiente — e viver com o risco de elas saírem de sincronia no dia em que alguém trocar a senha em uma só. Preferimos o contrário: **uma única `DATABASE_URL` no formato `mysql://`**, e a troca do esquema feita em um único ponto do código, dentro do `PrismaService`:

```ts
function paraUrlDoDriver(url: string): string {
  return url.replace(/^mysql:\/\//, 'mariadb://');
}
```

---

## Sobre o `schema.prisma`

Os modelos têm nomes em inglês e no singular — `User`, `Address`, `Contact` — porque é a convenção do Prisma e é o que deixa o código legível (`prisma.user.findMany()`). O `@@map` amarra cada modelo à tabela real:

```prisma
model User {
  // ...
  @@map("usuarios")
}
```

Mesma lógica para colunas: `nomeMae` no código, `@map("NomeMae")` na tabela.

Três detalhes que vêm da especificação do banco e **não** de preferência:

- `@db.DateTime(0)` e `@db.Date` reproduzem os tipos exatos das colunas
- `@default(now())` e `@updatedAt` existem porque `createdAt`/`updatedAt` são `NOT NULL` **sem default no banco** — quem preenche é o Prisma, não o MySQL
- `role` tem `@default("user")` aqui, enquanto o banco tem `DEFAULT 'admin'`. Divergência **proposital**: o default do banco é uma falha de segurança que não podemos corrigir (não alteramos o schema), então a aplicação nunca deixa o banco decidir esse valor

---

## Migrations: não existem neste projeto

Não há pasta `prisma/migrations` e não haverá. As tabelas já existem, e os alunos não têm permissão para criá-las. Rodar `prisma migrate dev` aqui seria, na melhor das hipóteses, um erro de permissão — na pior, uma tentativa de recriar o que já está populado.

Para conferir se o `schema.prisma` continua fiel ao banco existe o `prisma:check`, que **apenas compara e informa**, sem alterar nada:

```powershell
npm run prisma:check
```

Por baixo:

```
prisma migrate diff --from-schema prisma/schema.prisma --to-config-datasource --exit-code
```

Lê-se assim: compare o que está declarado no `schema.prisma` (`--from-schema`) com o que existe de fato no banco apontado pelo `prisma.config.ts` (`--to-config-datasource`).

Códigos de saída com `--exit-code`:

| Código | Significado |
|---|---|
| `0` | Sem diferenças — o schema bate com o banco |
| `1` | Erro de execução (conexão, permissão, sintaxe) |
| `2` | Há diferenças entre o schema e o banco |

Como o banco é compartilhado pela turma, este comando é a forma rápida de responder "alguém mexeu na estrutura?" sem abrir cliente SQL.

### Baseline esperado do `prisma:check`

Neste projeto o `prisma:check` **sempre retorna 2**, e isso está certo. Existem duas divergências permanentes e propositais entre o `schema.prisma` e o banco. A saída esperada é exatamente esta:

```
[*] Changed the `contatos` table
  [*] Altered column `createdAt` (default changed from `Some(Now)` to `None`)

[*] Changed the `enderecos` table
  [*] Altered column `createdAt` (default changed from `Some(Now)` to `None`)

[*] Changed the `usuarios` table
  [*] Altered column `createdAt` (default changed from `Some(Now)` to `None`)
  [*] Altered column `role` (default changed from `Some(Value(String("user")))` to `Some(Value(String("admin")))`)
```

| Divergência | Por que existe |
|---|---|
| `createdAt` tem `@default(now())` no schema e nenhum default no banco | As colunas são `DATETIME NOT NULL` **sem default**. Quem preenche é o Prisma, do lado do cliente. Sem isso, todo `INSERT` falharia |
| `role` é `"user"` no schema e `'admin'` no banco | O default do banco é uma falha de segurança (cadastro público criaria admins) e não podemos alterá-lo. A aplicação nunca deixa o banco decidir esse valor |

**Como usar isso na prática:** compare a saída com o baseline acima. Se aparecer *qualquer outra linha* — coluna nova, tipo diferente, índice removido — aí sim há divergência real, e provavelmente alguém alterou a estrutura do banco compartilhado.

Esta execução também serviu como validação do `schema.prisma`: ele foi escrito à mão a partir do DDL, sem rodar `db pull`, e o diff não acusou **nenhuma** diferença estrutural — colunas, tipos, tamanhos, índices, chaves estrangeiras e a coluna `NomeMae` com seu `@map` estão todos corretos.

### Cuidado: a sintaxe do `migrate diff` mudou no Prisma 7

As flags `--from-schema-datamodel` e `--to-schema-datasource`, presentes em toda a documentação da versão 6, **foram removidas**:

```
Error: `--from-schema-datamodel` was removed. Please use `--[from/to]-schema` instead.
```

A troca faz sentido dentro da nova arquitetura: como a connection string saiu do `schema.prisma`, não existe mais "a datasource do schema" para apontar. Por isso surgiu `--to-config-datasource`, que lê a URL do `prisma.config.ts`.

---

## Gerando pela CLI

```powershell
# 1. dependências
npm i --save-exact @prisma/client@7.10.0 @prisma/adapter-mariadb@7.10.0
npm i -D --save-exact prisma@7.10.0 dotenv@17.4.2

# 2. estrutura do Prisma: cria prisma/schema.prisma, prisma.config.ts e .env
npx prisma init --datasource-provider mysql --output ../src/generated/prisma

# 3. preencher DATABASE_URL no .env

# 4. INTROSPECÇÃO: os modelos vêm do banco, não são digitados
npx prisma db pull

# 5. gerar o client
npx prisma generate

# 6. scripts
npm pkg set scripts.prisma:generate="prisma generate"
npm pkg set scripts.prisma:pull="prisma db pull"
npm pkg set scripts.prisma:studio="prisma studio"
npm pkg set scripts.prisma:check="prisma migrate diff --from-schema prisma/schema.prisma --to-config-datasource --exit-code"
```

O passo 4 é o coração da fase. O `db pull` lê o banco e escreve os modelos sozinho — o aluno não transcreve o DDL. Atenção: ele **sobrescreve** o `schema.prisma`, então rode antes de qualquer ajuste manual.

**Editado à mão depois do `db pull`** (a introspecção não tem como adivinhar essas escolhas):

| Ajuste | Por quê |
|---|---|
| `usuarios` → `model User` + `@@map("usuarios")` | Nome de modelo em inglês e singular, convenção do Prisma |
| `NomeMae` → `nomeMae` + `@map("NomeMae")` | camelCase no código |
| `@default(now())` e `@updatedAt` | O banco não tem default nessas colunas; quem preenche é o Prisma |
| `role` com `@default("user")` | Divergência proposital do banco, por segurança |
| `moduleFormat = "cjs"` no generator | Sem isso o código gerado usa imports com `.js`, que o TypeScript em CommonJS não resolve |

Depois de ajustar, rode `npx prisma generate` de novo.

Cuidado: `prisma init` também cria um `.gitignore` e um `.env`. Se esses arquivos já existirem no projeto, confira o que ele fez antes de seguir.

---

## Problema encontrado: `P1012` no `prisma:generate`

Primeira execução do `npm run prisma:generate`:

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
       Move connection URLs for Migrate to `prisma.config.ts` and pass either
       `adapter` for a direct database connection or `accelerateUrl` for
       Accelerate to the `PrismaClient` constructor.
```

**Causa.** Até o Prisma 6, o bloco `datasource` trazia `url = env("DATABASE_URL")`. No Prisma 7 isso foi **removido**, e a mudança é coerente com o resto da versão: a conexão agora tem dois consumidores diferentes, e cada um pega a URL de um lugar próprio.

| Quem precisa da URL | De onde ela vem |
|---|---|
| CLI (`generate`, `db pull`, `migrate diff`) | `prisma.config.ts`, no bloco `datasource.url` |
| Aplicação em execução | driver adapter passado ao construtor do `PrismaClient` |

O `schema.prisma` deixa de ter qualquer segredo — ele descreve só a **forma** dos dados, e o `provider` continua ali porque define o dialeto SQL a ser gerado.

**Correção:** a linha `url` foi removida do bloco `datasource`. Ele agora tem apenas o `provider`.

Vale notar para o material da turma: quase todo tutorial de Prisma disponível hoje ainda mostra o `url` dentro do `datasource`, porque foi assim por muitas versões. Copiar um exemplo antigo leva direto a este erro.

---

## O que rodar agora (no Windows)

```powershell
# 1. instalar as dependências novas
npm install

# 2. gerar o Prisma Client a partir do schema
npm run prisma:generate

# 3. conferir se o schema bate com o banco real
npm run prisma:check

# 4. (opcional, didático) ver o que a introspecção geraria, sem sobrescrever nada
npx prisma db pull --print
```

O passo 4 é interessante para a aula: mostra o schema "cru" que o banco produziria e permite comparar com a versão refinada, com os nomes mapeados.

### Atenção ao proxy

A CLI do Prisma baixa um binário (`schema-engine`) de `binaries.prisma.sh` na primeira execução. Em rede corporativa com proxy restritivo, esse download é bloqueado e o erro aparece como `403 Forbidden` — foi exatamente o que aconteceu no ambiente de automação deste projeto. Se algum aluno esbarrar nisso, o problema é liberação de rede, não configuração do Prisma.

---

## Próxima fase

**Fase 3 — PrismaService:** módulo global, ciclo de vida da conexão e rota `/health`.
