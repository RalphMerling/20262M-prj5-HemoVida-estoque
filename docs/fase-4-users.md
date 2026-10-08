# Fase 4 — CRUD de Usuários

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

CRUD completo de usuários, com validação de entrada e senha em hash. **Ainda sem autenticação** — as regras de acesso entram na fase 6.

---

## Gerando pela CLI

```powershell
npm i --save-exact bcrypt@6.0.0
```

> Instala a biblioteca que gera e confere o hash das senhas. `--save-exact` grava `"6.0.0"` em vez de `"^6.0.0"`: toda a turma usa a mesma versão e ninguém pega atualização no meio do semestre.

```powershell
npm i -D --save-exact @types/bcrypt@6.0.0
```

> O `bcrypt` é escrito em C++ e não traz tipagem TypeScript. Este pacote adiciona só os tipos. `-D` porque tipos servem ao desenvolvimento, não à execução.

```powershell
npx nest g module users
npx nest g service users --no-spec
npx nest g controller users --no-spec
```

> Cria os três arquivos já com os decorators corretos e registra o `UsersModule` no `app.module.ts` automaticamente. `--no-spec` pula os arquivos de teste, fora do escopo por enquanto.

**Escrito à mão:** os DTOs, a lógica do service, as rotas do controller e o validador `EhLatin1` — nenhum gerador sabe as regras do seu negócio.

---

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/users/dto/create-user.dto.ts` | Validação do cadastro |
| `src/users/dto/update-user.dto.ts` | Validação da atualização |
| `src/users/users.service.ts` | Regras e acesso ao banco |
| `src/users/users.controller.ts` | Rotas |
| `src/common/validators/eh-latin1.validator.ts` | Validador customizado |
| `src/common/helpers/data.ts` | Conversão de data para UTC |

---

## Decisões

### O `CreateUserDto` não tem o campo `role`

Essa ausência é a trava de segurança central do projeto. A rota de cadastro é pública; se `role` estivesse no DTO, qualquer pessoa se cadastraria como administrador.

E o `ValidationPipe` roda com `forbidNonWhitelisted: true`, então mandar `"role": "admin"` no corpo devolve **400** — o campo não é ignorado em silêncio, é recusado com mensagem. O service grava `role: 'user'` fixo, sem nunca deixar o `DEFAULT 'admin'` do banco agir.

### Omissão global da senha

No `PrismaService`:

```ts
omit: { user: { senha: true } }
```

Nenhuma consulta a `user` devolve o hash, em lugar nenhum da aplicação. O único ponto que precisa dele — o login — pede explicitamente com `omit: { senha: false }`.

Por que não filtrar no controller: ali basta esquecer **um** caminho para o hash vazar. Aqui o padrão é não vazar, e a exceção é visível e única.

### Senha limitada a 72 caracteres

Não é arbitrário: o bcrypt ignora tudo depois do 72º byte. Sem esse limite, uma senha de 80 caracteres e os seus 72 primeiros caracteres seriam a mesma senha — e ninguém perceberia.

### Custo 12 no bcrypt

Cada ponto a mais dobra o tempo de cálculo. 12 é o equilíbrio atual entre resistência a força bruta e latência aceitável no login.

### O validador `EhLatin1`

As colunas são `latin1_swedish_ci` e o MySQL 5.7 roda em `sql_mode` estrito. Um emoji no nome viraria o **erro 1366** no banco, e o usuário receberia um 500 sem explicação. O validador transforma isso num 400 dizendo exatamente o que houve.

Os `@MaxLength` também batem exatamente com os `VARCHAR` do banco, pelo mesmo motivo.

### Data em UTC explícito

`new Date('1990-05-17')` já é UTC, mas qualquer construção pelo fuso local gravaria o dia anterior — o Brasil está em UTC-3 e a coluna é `DATE`, sem hora. O deslocamento seria invisível até alguém reparar que todo mundo nasceu um dia antes.

---

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/user` | Lista todos (sem senha) |
| `GET` | `/user/:id` | Busca um (sem senha) |
| `POST` | `/user` | Cadastra, sempre com perfil `user` |
| `PUT` | `/user/:id` | Atualiza |
| `DELETE` | `/user/:id` | Remove (endereços e contatos vão junto, por cascata da FK) |

---

## Próxima fase

**Fase 5 — Autenticação:** `POST /login`, JWT e o guard global.
