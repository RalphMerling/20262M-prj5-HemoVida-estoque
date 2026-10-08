# Fase 1 — Scaffold

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Estrutura mínima do projeto, versões fixadas e validação do `.env`. Ainda sem banco, sem autenticação e sem rotas de negócio — o objetivo desta fase é ter uma aplicação que **sobe** e que **recusa subir** se a configuração estiver errada.

---

## Arquivos criados

| Arquivo | Papel |
|---|---|
| `package.json` | Dependências com **versão exata** e scripts |
| `tsconfig.json` | Compilador em modo estrito, com decorators habilitados |
| `tsconfig.build.json` | Exclusões do build |
| `nest-cli.json` | Configuração do Nest CLI |
| `.nvmrc` | Node 24 — quem usa nvm troca de versão com um comando |
| `.gitignore` | `.env`, `node_modules`, `dist` e o client gerado do Prisma |
| `.env.example` | Modelo do `.env`, versionado e sem segredos |
| `src/main.ts` | Bootstrap e `ValidationPipe` global |
| `src/app.module.ts` | Módulo raiz com `ConfigModule` global |
| `src/config/env.validation.ts` | Validação das variáveis de ambiente no boot |

---

## Decisões desta fase

### Versões exatas, sem `^`

Todas as dependências estão fixadas sem acento circunflexo. Num projeto que vai ser replicado por uma turma inteira ao longo de um semestre, `^12.0.3` significa que o aluno de outubro instala uma versão diferente da do aluno de agosto — e a diferença aparece como um erro que ninguém consegue reproduzir.

Duas armadilhas concretas que isso evita, ambas reais hoje:

- `npm install typescript` traz a **7.0.2**. O NestJS 12 é validado com a linha **6.x**. Por isso `"typescript": "6.0.3"`.
- `npm install prisma` traz a **8.0.0-rc.15**, um release candidate que **ainda não tem conector MySQL**. Por isso, na fase 2, a instalação será `prisma@7.10.0` exata.

### `forbidNonWhitelisted` no `ValidationPipe`

Não é preciosismo: é o que impede alguém de enviar `"role": "admin"` no corpo do cadastro. Um campo não declarado no DTO devolve **400**, em vez de ser silenciosamente ignorado — ou pior, aceito.

### Validação do `.env` no boot

`src/config/env.validation.ts` verifica as quatro variáveis antes de a aplicação subir:

- `DATABASE_URL` presente e começando com `mysql://`
- `JWT_SECRET` com no mínimo 32 caracteres
- `JWT_EXPIRES_IN` num formato válido (`15m`, `1h`, `7d`)
- `PORT` inteiro entre 1 e 65535

Se algo falhar, o processo morre no start com a lista do que está errado. A alternativa — subir mesmo assim — significaria assinar tokens JWT com segredo vazio, o que é uma falha de segurança que não dá erro visível.

### Sem Nodemon

O Nest já traz `nest start --watch`, exposto no script `npm run start:dev`. Adicionar Nodemon seria uma segunda dependência fazendo exatamente o mesmo trabalho.

---

## Gerando pela CLI

Os comandos que produzem esta fase (ver `00-convencoes.md`):

```powershell
# 1. criar o projeto
npx @nestjs/cli@12.0.3 new nodenestprisma --package-manager npm --skip-git

cd nodenestprisma

# 2. fixar as versões exatas (--save-exact grava sem o ^)
npm i --save-exact @nestjs/common@12.0.3 @nestjs/core@12.0.3 `
  @nestjs/platform-express@12.0.3 @nestjs/config@12.0.0 `
  class-validator@0.15.1 class-transformer@0.5.1 `
  reflect-metadata@0.2.2 rxjs@7.8.2

npm i -D --save-exact typescript@6.0.3 @nestjs/cli@12.0.3 `
  @nestjs/schematics@12.0.3 @types/node@24.13.5 @types/express@5.0.6

# 3. declarar a versão mínima do Node
npm pkg set engines.node=">=24.0.0"
```

> Em PowerShell, a crase (`` ` ``) quebra a linha. No CMD ou no bash, use `^` ou `\`, ou deixe tudo numa linha só.

O `nest new` do Nest 12 já traz Vitest e oxlint configurados. Como testes automatizados estão fora do escopo por ora, essas dependências podem ser removidas — ou mantidas, se você preferir apresentá-las mais adiante.

**Escritos à mão nesta fase** (não há gerador para eles):

- `.nvmrc`
- `.env.example`
- `src/config/env.validation.ts`
- os ajustes em `tsconfig.json` (`rootDir`, remoção do `baseUrl`)

---

## Problemas encontrados (e por que valem o passo-a-passo)

### `TS5011` e `TS5101` no primeiro `npm run start:dev`

O primeiro `tsconfig.json` desta fase estava escrito no padrão que o Nest usava com TypeScript 5. Com a **linha 6.x** ele quebra com dois erros:

```
error TS5011: The common source directory of 'tsconfig.build.json' is './src'.
              The 'rootDir' setting must be explicitly set to this or another path.

error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
              Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
```

**Causa.** O TypeScript 6 é a versão-ponte para o 7 (a reescrita em Go). Ele transforma em erro o que antes era comportamento implícito ou apenas desaconselhado:

- `rootDir` não é mais inferido. Sem ele, o compilador não sabe qual pasta é a raiz do código e se recusa a decidir sozinho o layout do `dist`.
- `baseUrl` está deprecado. Ele existia para resolver imports não relativos sem `paths`, e some no 7.0.

**Correção aplicada:**

- `"rootDir": "./src"` adicionado
- `"baseUrl"` removido — este projeto não usa alias de import, então ele não fazia nada além de gerar o aviso

Note que a saída muda: **sem** `rootDir`, o build gerava `dist/src/main.js`; **com** ele, gera `dist/main.js` — que é o caminho que o script `start:prod` espera. O erro do `baseUrl` escondia esse segundo problema.

A tentação aqui é silenciar com `"ignoreDeprecations": "6.0"`. É a escolha errada: adia o trabalho para o dia em que o TypeScript 7 sair e o projeto simplesmente parar de compilar.

**Verificação:** `npx tsc -p tsconfig.build.json --noEmit` termina sem nenhum erro, e o emit gera `dist/main.js`, `dist/app.module.js` e `dist/config/env.validation.js`.

### A API reinicia sozinha, em loop, no `start:dev`

Sintoma: `npm run start:dev` sobe a aplicação e, sem ninguém tocar em nada, ela recompila e reinicia repetidamente.

**Causa.** O `tsconfig.json` tinha `"incremental": true`. Com essa opção, o TypeScript grava um arquivo de cache de compilação — o `tsconfig.build.tsbuildinfo`, com quase 180 KB — e ele foi parar na **raiz do projeto**, que é justamente a pasta que o watcher do Nest observa.

O resultado é um ciclo que se alimenta sozinho:

```
compila  ->  grava o .tsbuildinfo na raiz
   ^                    |
   |                    v
   +----  watcher vê "arquivo mudou"
```

**Correção:** remover `"incremental": true`.

Não se perde nada. O `nest start --watch` já faz compilação incremental em memória, pelo `tsc -w`. E como o `nest-cli.json` está com `"deleteOutDir": true`, a pasta `dist` é apagada a cada build — o cache em disco seria descartado de qualquer forma. A opção estava só atrapalhando.

> Sobrou um `tsconfig.build.tsbuildinfo` na raiz, do tempo em que a opção estava ligada. Ele é inofensivo e já está no `.gitignore`, mas pode apagar.

**Se o loop continuar depois disso**, a suspeita seguinte é o OneDrive: a sincronização reescreve arquivos e atualiza a data de modificação, o que o watcher lê como alteração. É mais um motivo para tirar a pasta do projeto da sincronização, ou movê-la para fora do OneDrive.

### Atenção: `node_modules` dentro do OneDrive

A pasta do projeto está em `OneDrive - Firjan`. O OneDrive tenta sincronizar as dezenas de milhares de arquivos de `node_modules`, o que causa lentidão, travas de arquivo durante o `npm install` e consumo de banda sem propósito — `node_modules` é conteúdo descartável, reconstruído a partir do `package-lock.json`.

Recomendado: marcar a pasta `node_modules` como **"Sempre manter neste dispositivo"** desativada e excluída da sincronização, ou manter projetos de código fora do OneDrive (por exemplo em `C:\dev\`). Vale citar no material da turma, porque muito aluno guarda tudo em OneDrive ou Google Drive sincronizado.

---

## O que rodar agora (no Windows)

```powershell
cd "C:\Users\vhreis\OneDrive - Firjan\Documentos\NodeNestPrisma"

# 1. instalar as dependências (gera o package-lock.json)
npm install

# 2. criar o .env a partir do modelo
Copy-Item .env.example .env

# 3. gerar o JWT_SECRET e colar no .env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 4. preencher DATABASE_URL no .env com usuário e senha reais

# 5. subir
npm run start:dev
```

### Como saber que deu certo

- O terminal mostra `API no ar em http://localhost:3000`
- `http://localhost:3000` responde **404** — está certo: ainda não existe nenhuma rota

### Teste proposital de falha

Vale fazer uma vez, porque é o que demonstra a validação funcionando. Apague o valor de `JWT_SECRET` no `.env` e rode `npm run start:dev` de novo: a aplicação deve morrer com a mensagem informando que o segredo precisa ter no mínimo 32 caracteres. Devolva o valor depois.

---

## Próxima fase

**Fase 2 — Prisma:** instalar `prisma@7.10.0` e `@prisma/client@7.10.0`, criar o `prisma.config.ts`, rodar `npx prisma db pull` contra o banco e refinar o `schema.prisma` com os nomes de modelo em inglês mapeados para as tabelas em português.
