# Fases 7 e 8 — Endereços e Contatos

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Os dois recursos seguem exatamente a mesma estrutura, por isso estão no mesmo documento. Construir o segundo depois do primeiro é um bom exercício de fixação.

---

## Gerando pela CLI

```powershell
npx nest g module addresses
npx nest g service addresses --no-spec
npx nest g controller addresses --no-spec

npx nest g module contacts
npx nest g service contacts --no-spec
npx nest g controller contacts --no-spec
```

> Mesma tríade da fase 4. O CLI registra os dois módulos no `app.module.ts` sozinho.

Repare que os nomes dos módulos são plurais em inglês (`addresses`, `contacts`), mas as **rotas** são singulares (`/address`, `/contact`), porque foi assim que a especificação pediu. O `@Controller('address')` é quem define a rota — o nome da pasta não influencia.

---

## O detalhe que exige atenção

O parâmetro da rota **muda de significado conforme o método HTTP**:

```
GET    /address/:idUser   ->  id do USUÁRIO   (liste os endereços dele)
POST   /address/:idUser   ->  id do USUÁRIO   (crie um endereço para ele)
PUT    /address/:id       ->  id do ENDEREÇO  (altere este endereço)
DELETE /address/:id       ->  id do ENDEREÇO  (remova este endereço)
```

Isso é válido em HTTP — o roteamento distingue pelo método — mas confunde quem lê o código depois. Duas providências:

1. Os parâmetros têm **nomes diferentes** (`idUser` e `id`), e não o mesmo nome em todos
2. Há um comentário no topo de cada controller explicando a convenção

Consequência prática na verificação de acesso:

| Rota | Como o dono é descoberto |
|---|---|
| `GET`/`POST` `/address/:idUser` | O próprio parâmetro **é** o dono — checa direto |
| `PUT`/`DELETE` `/address/:id` | Precisa **carregar o endereço** para saber de quem é |

No segundo caso o service busca o registro primeiro e só então chama `garantirDonoOuAdmin`. Se o registro não existir, vem **404** antes de qualquer checagem de permissão.

---

## Validações

**Endereço:**

| Campo | Regra | Por quê |
|---|---|---|
| `cep` | 8 dígitos, com ou sem hífen | Aceita `20031-170` e `20031170` |
| `estado` | exatamente 2 letras maiúsculas | A coluna é `VARCHAR(2)` |
| demais textos | `@MaxLength` igual ao `VARCHAR` + `EhLatin1` | `sql_mode` estrito recusaria no banco |

**Contato:**

| Campo | Regra |
|---|---|
| `numeroTelefone` | dígitos, espaços, parênteses, `+` e `-`, de 8 a 30 caracteres |

O formato do telefone é permissivo de propósito: aceita `21999998888`, `(21) 99999-8888` e `+55 21 99999-8888`. Validar máscara brasileira rígida rejeitaria números internacionais legítimos — e a coluna é só um `VARCHAR(30)`.

---

## Tratamento do usuário inexistente

Criar endereço para um usuário que não existe viola a chave estrangeira. O Prisma devolve **P2003**, que o service traduz:

```ts
if (erro.code === 'P2003') {
  throw new NotFoundException(`Usuario ${idUsuario} nao encontrado`);
}
```

Sem isso, o cliente receberia um 500 com o nome da constraint do banco.

Alternativa possível: consultar se o usuário existe antes de inserir. Preferimos deixar o banco responder — é uma consulta a menos e não tem janela de corrida entre a checagem e a inserção.

---

## Como testar

| Teste | Esperado |
|---|---|
| `GET /address/:seuId` com seu token | `200` com a lista |
| `GET /address/:idDeOutro` com seu token | `403` |
| `GET /address/:idDeOutro` com token de admin | `200` |
| `POST /address/99999` (usuário inexistente) | `404` |
| `PUT /address/:id` de endereço de outro | `403` |
| `estado: "rj"` (minúsculo) | `400` |
| `cep: "123"` | `400` |

---

## Próxima fase

**Fase 9 — Robustez:** filtro de exceções do Prisma, helmet e rate limit no login.
