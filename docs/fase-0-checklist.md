# Fase 0 — Pré-requisitos

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Esta fase não escreve código. Ela existe para garantir que, quando o projeto for replicado em outra máquina, o ambiente já esteja correto — e para descobrir problemas de rede antes de eles virarem "erro estranho do Prisma".

---

## Por que parte disso só você consegue rodar

O ambiente de automação é um **Linux isolado**, com Node 22.23.2 e **sem acesso à porta 3306**. Ele enxerga só esta pasta e a rede HTTP(S). O projeto vai rodar no **Windows**, onde está o Node que importa e de onde o banco é alcançável.

Consequência prática, válida para o projeto inteiro:

| Tarefa | Onde roda |
|---|---|
| Escrever código e arquivos de configuração | Automação (nesta pasta) |
| `npm install` / `npm ci` | **Windows** |
| `npx prisma db pull` / `generate` | **Windows** |
| `npm run start:dev` | **Windows** |
| Qualquer coisa que toque o banco | **Windows** |

O `bcrypt` traz binário nativo por sistema operacional: um `node_modules` gerado no Linux **não funciona** no Windows. Por isso a instalação de dependências nunca é feita pela automação.

---

## Checklist

Rode no **PowerShell**, dentro da pasta do projeto.

### 1. Node.js 24 LTS

```powershell
node -v
```

Esperado: `v24.x.x`.

Se não estiver instalado ou estiver em outra versão:

```powershell
winget install OpenJS.NodeJS.LTS
```

Alternativa recomendada para quem alterna entre projetos — [nvm-windows](https://github.com/coreybutler/nvm-windows):

```powershell
nvm install 24
nvm use 24
```

- [ ] `node -v` devolve `v24.x.x`

### 2. npm

```powershell
npm -v
```

Esperado: `10.x` ou superior (vem junto com o Node).

- [ ] `npm -v` respondeu

### 3. Git

```powershell
git --version
```

- [ ] Git instalado

### 4. Conectividade com o banco

```powershell
Test-NetConnection edumysql.acesso.rj.senac.br -Port 3306
```

Esperado: `TcpTestSucceeded : True`.

Se vier `False`, o problema é rede (firewall corporativo, VPN ou bloqueio de saída na porta 3306) — **não** é o código. Vale testar de outra rede antes de seguir. Esse é exatamente o ponto em que alunos costumam travar sem saber por quê, então convém deixar este teste no passo-a-passo.

- [ ] `TcpTestSucceeded : True`

### 5. Autenticação no banco

Com um cliente já instalado (HeidiSQL, DBeaver, MySQL Workbench ou `mysql` CLI), conecte com:

- Host: `edumysql.acesso.rj.senac.br`
- Porta: `3306`
- Banco: `20252_tecweb3_vitorreis`

E confirme:

```sql
SELECT VERSION();
SHOW TABLES;
SELECT COUNT(*) FROM usuarios;
SELECT @@sql_mode;
```

Esperado: versão `5.7.30`, as três tabelas (`usuarios`, `contatos`, `enderecos`) e `STRICT_TRANS_TABLES` presente no `sql_mode`.

- [ ] Login funciona
- [ ] `SELECT VERSION()` devolve 5.7.30
- [ ] As três tabelas aparecem
- [ ] `sql_mode` confirmado

### 6. Editor

VS Code com as extensões **Prisma** (destaque de sintaxe do `schema.prisma`) e **ESLint**, se ainda não tiver.

- [ ] Editor pronto

---

## O que já foi verificado pela automação

| Item | Resultado |
|---|---|
| Pasta do projeto | Vazia, pronta para receber o scaffold |
| Prisma 7.10.0 suporta MySQL 5.7 | ✅ confirmado na matriz oficial (5.6 / 5.7 / 8.0 / 8.4) |
| `prisma@latest` no npm | ⚠️ aponta para `8.0.0-rc.15`, sem conector MySQL — instalar `7.10.0` exato |
| `typescript@latest` no npm | ⚠️ aponta para `7.0.2` — o Nest 12 usa a linha `6.x` |
| `@nestjs/jwt` 12.0.2 | ✅ compatível com `@nestjs/common ^12` |
| `bcrypt` 6.0.0 | ✅ instala por binário pré-compilado (N-API), sem compilar |
| Porta 3306 a partir da automação | ❌ inacessível — por isso o passo 4 é seu |

---

## Saída desta fase

Com os seis itens marcados, a fase 1 pode começar: estrutura do projeto, `package.json` com versões fixadas, `.gitignore`, `.nvmrc` e `.env.example`.
