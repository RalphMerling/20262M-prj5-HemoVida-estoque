# Fase 9 — Robustez

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Três camadas que não mudam nenhuma funcionalidade, mas mudam o que acontece quando algo dá errado.

---

## Gerando pela CLI

```powershell
npm i --save-exact helmet@8.3.0
```

> Middleware que adiciona cabeçalhos HTTP de segurança (CSP, X-Frame-Options, HSTS e outros). Uma linha que fecha uma família inteira de problemas conhecidos.

```powershell
npm i --save-exact @nestjs/throttler@6.7.0
```

> Limitador de requisições por IP. Usado aqui só no login.

```powershell
npx nest g filter common/filters/prisma-exception --no-spec --flat
```

> Cria um *exception filter*: uma classe que intercepta exceções de um tipo específico e decide qual resposta HTTP devolver.

---

## 1. Filtro de exceções do Prisma

Sem ele, uma violação de unicidade que escape do service vira **500 com a stack trace do Prisma no corpo da resposta** — inútil para quem consome a API e, pior, vaza nome de tabela, de coluna e de índice.

O filtro traduz:

| Código Prisma | HTTP | Significado |
|---|---|---|
| `P2002` | `409 Conflict` | Valor único duplicado |
| `P2003` | `400 Bad Request` | Chave estrangeira inválida |
| `P2025` | `404 Not Found` | Registro não encontrado |
| outros | `500` | Mensagem genérica; detalhe só no log |

Os services continuam tratando os casos que conhecem, porque ali dá para escrever mensagem específica ("Já existe um usuário com este email"). O filtro cuida do que ninguém previu.

Registrado globalmente via `APP_FILTER` no `AppModule`.

**Detalhe importante:** a stack completa vai para o log do servidor, nunca para o cliente. Quem opera a API precisa do detalhe; quem a consome, não.

## 2. Helmet

```ts
app.use(helmet());
```

Uma linha, no `main.ts`, antes de tudo.

## 3. Rate limit no login

```ts
@UseGuards(ThrottlerGuard)
@Throttle({ login: { limit: 5, ttl: 60_000 } })
```

Cinco tentativas por minuto, por IP, **apenas na rota de login**.

Por que só ali: é a única rota onde tentativa repetida é sinal de ataque. Limitar a API inteira atrapalharia uso legítimo sem ganho proporcional.

O efeito é desproporcional ao esforço: um ataque de força bruta que levaria minutos passa a levar anos. É a proteção mais barata que existe para uma rota de login.

> `ttl` é em **milissegundos** a partir do `@nestjs/throttler` 5. Em versões anteriores era em segundos — outro caso de exemplo antigo da internet que não funciona mais.

---

## Como testar

| Teste | Esperado |
|---|---|
| `POST /user` com email já cadastrado | `409` com mensagem legível, sem stack trace |
| 6 tentativas de login em menos de 1 minuto | A 6ª devolve `429 Too Many Requests` |
| `curl -I http://localhost:3000/health` | Cabeçalhos do helmet presentes (`X-Frame-Options`, `Content-Security-Policy`…) |

---

## Próxima fase

**Fase 10 — Swagger.**
