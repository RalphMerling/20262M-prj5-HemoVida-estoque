# Fase 5 — Autenticação JWT

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

---

## Gerando pela CLI

```powershell
npm i --save-exact @nestjs/jwt@12.0.2
```

> Módulo oficial do Nest para assinar e verificar tokens JWT. Envolve a biblioteca `jsonwebtoken` e a integra ao sistema de injeção de dependências.

```powershell
npx nest g module auth
npx nest g service auth --no-spec
npx nest g controller auth --no-spec
npx nest g guard auth/guards/jwt-auth --no-spec --flat
npx nest g decorator auth/decorators/public --flat
```

> Os dois últimos criam um guard e um decorator. `--flat` evita que o CLI crie uma subpasta extra com o nome do arquivo.

**Nota:** não usamos Passport. Para um único fluxo de JWT, um guard próprio sobre o `@nestjs/jwt` tem menos dependências e deixa a validação do token visível no código — que é o que se quer ensinar.

---

## Como funciona

```
POST /login  { email, senha }
      |
      v
  busca o usuário COM a senha (omit: { senha: false })
      |
      v
  bcrypt.compare(senha enviada, hash do banco)
      |
      v
  assina { sub, email, role }  ->  { access_token, token_type, expires_in }
```

Nas demais rotas, o `JwtAuthGuard` lê o cabeçalho `Authorization: Bearer <token>`, verifica a assinatura e coloca o resultado em `request.user`.

---

## Decisões

### Guard global, liberação explícita

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

Por padrão **tudo** exige token. As rotas abertas são marcadas com `@Public()`.

Isso inverte o risco a favor da segurança. Esquecer de proteger uma rota não deixa buraco aberto; esquecer de liberar uma rota pública aparece no primeiro teste, como um 401 evidente. O contrário — proteger caso a caso — falha em silêncio.

### Mensagem de erro única no login

"Email ou senha inválidos", nos dois casos. Dizer "email não cadastrado" entregaria de graça a lista de quem tem conta.

E vai além da mensagem: quando o email não existe, o código compara a senha contra um **hash descartável**. Sem isso, o email inexistente responderia na hora e o email existente com senha errada demoraria os ~200 ms do bcrypt. Essa diferença de tempo permite descobrir quais emails estão cadastrados — mesmo com a mensagem idêntica.

### `@HttpCode(200)` no login

O padrão do Nest para `POST` é **201 Created**. Aqui não se cria recurso nenhum, apenas se autentica.

### A `role` viaja dentro do token

Consequência: se um admin rebaixar alguém, o token antigo continua valendo até expirar. Com validade de 1 hora é aceitável para o exercício. A alternativa seria consultar o banco a cada requisição — mais correto, mais caro.

Esse é o tipo de decisão que um projeto real precisa tomar conscientemente, e que vale discutir em aula.

---

## Como testar

```powershell
curl -X POST http://localhost:3000/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"seu@email.com\",\"senha\":\"suasenha\"}'
```

Depois use o token:

```powershell
curl http://localhost:3000/address/1 -H "Authorization: Bearer <token>"
```

Testes que devem **falhar** (e é isso que prova que funciona):

| Teste | Esperado |
|---|---|
| Rota protegida sem token | `401` |
| Token adulterado (mude um caractere) | `401` |
| Senha errada no login | `401` |

---

## Próxima fase

**Fase 6 — RBAC e propriedade:** o `RolesGuard` e a regra "admin ou o próprio dono".
