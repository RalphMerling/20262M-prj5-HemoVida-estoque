# Fase 6 — RBAC e propriedade

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

---

## Gerando pela CLI

```powershell
npx nest g guard auth/guards/roles --no-spec --flat
npx nest g decorator auth/decorators/roles --flat
npx nest g decorator auth/decorators/usuario-atual --flat
```

> Três peças: o guard que barra por perfil, o decorator que marca quais perfis uma rota exige, e o decorator de parâmetro que injeta o usuário do token direto no método do controller.

---

## Duas regras diferentes, dois mecanismos

Este é o ponto conceitual da fase. As regras de acesso deste projeto têm duas naturezas:

| Tipo de regra | Exemplo | Onde é verificada |
|---|---|---|
| Depende só do **perfil** | `DELETE /user/:id` exige admin | `RolesGuard` |
| Depende do **registro** | `PUT /address/:id` exige ser dono *daquele endereço* | Service, via `garantirDonoOuAdmin` |

Por que não colocar tudo em guard: para `/address/:id`, descobrir o dono exige carregar o endereço do banco — e o service vai carregá-lo de qualquer forma. Um guard faria uma segunda consulta para saber a mesma coisa.

Por que não colocar tudo no service: para `DELETE /user/:id`, o perfil já vem no token. Consultar o banco para negar acesso que o token sozinho já nega é trabalho desperdiçado.

A regra prática: **guard quando a informação já está no token; service quando precisa do registro.**

---

## Matriz implementada

| Método | Rota | Acesso | Mecanismo |
|---|---|---|---|
| `POST` | `/login` | aberto | `@Public()` |
| `GET` | `/user` | aberto | `@Public()` |
| `GET` | `/user/:id` | aberto | `@Public()` |
| `POST` | `/user` | aberto | `@Public()` |
| `PUT` | `/user/:id` | admin ou o próprio | `garantirDonoOuAdmin` |
| `DELETE` | `/user/:id` | somente admin | `@Roles('admin')` |
| `GET`/`POST` | `/address/:idUser` | admin ou dono | `garantirDonoOuAdmin` |
| `PUT`/`DELETE` | `/address/:id` | admin ou dono | carrega o registro, depois `garantirDonoOuAdmin` |
| `GET`/`POST` | `/contact/:idUser` | admin ou dono | `garantirDonoOuAdmin` |
| `PUT`/`DELETE` | `/contact/:id` | admin ou dono | carrega o registro, depois `garantirDonoOuAdmin` |

---

## A brecha que quase passou

O `UpdateUserDto` tem o campo `role` — um admin precisa conseguir promover alguém. Mas `PUT /user/:id` também é acessível ao próprio usuário.

Sem tratamento, qualquer pessoa se promoveria a admin com um `PUT` no próprio cadastro. A checagem está no service:

```ts
if (dto.role !== undefined && !ehAdmin(solicitante)) {
  throw new ForbiddenException(
    'Somente um administrador pode alterar o perfil de acesso',
  );
}
```

Vale o destaque em aula: a regra "o usuário pode editar o próprio cadastro" parece inofensiva até você reparar que *um dos campos do cadastro é o nível de acesso*.

---

## O primeiro administrador

`POST /user` sempre cria com `role = 'user'`, de propósito. O primeiro admin nasce fora da API:

```powershell
node scripts/gerar-hash.js "SuaSenhaForte"
```

> Gera o hash bcrypt da senha. O MySQL não tem função bcrypt, então o hash precisa ser calculado fora e colado no `INSERT`.

Depois, no HeidiSQL, edite e execute `scripts/seed-admin.sql`.

Isso rende uma boa demonstração: mostra por que a senha nunca é gravada em texto puro, e por que criar administrador não é — e não deve ser — uma rota da API.

> Lembre-se de que o banco é compartilhado pela turma e `email` é UNIQUE. Use suas iniciais ou matrícula no email do admin.

---

## Como testar

O que mais importa aqui são os testes que **devem** falhar:

| Teste | Esperado |
|---|---|
| Usuário comum tentando `DELETE /user/:id` | `403` |
| Usuário A lendo `/address/:idDoB` | `403` |
| Usuário comum mandando `"role":"admin"` num `PUT` do próprio cadastro | `403` |
| Qualquer um mandando `"role":"admin"` no `POST /user` | `400` |
| Admin fazendo qualquer uma das operações acima | `200` |

---

## Próximas fases

**7 e 8 — Endereços e Contatos.**
