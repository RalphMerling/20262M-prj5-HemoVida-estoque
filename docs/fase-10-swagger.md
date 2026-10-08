# Fase 10 — Swagger

**Projeto:** NodeNestPrisma · **Data:** 17/09/2026

Documentação interativa em `/docs`. Como testes automatizados estão fora do escopo por ora, o Swagger UI é **a** ferramenta de verificação do projeto.

---

## Gerando pela CLI

```powershell
npm i --save-exact @nestjs/swagger@12.0.1
```

> Gera a especificação OpenAPI a partir dos decorators e serve a interface do Swagger UI.

Depois, no `nest-cli.json`, ative o plugin:

```json
"compilerOptions": {
  "deleteOutDir": true,
  "plugins": ["@nestjs/swagger"]
}
```

> O plugin lê os DTOs em tempo de compilação e gera os `@ApiProperty` sozinho, a partir dos tipos TypeScript e dos decorators do `class-validator`. Sem ele, cada campo de cada DTO precisaria de um `@ApiProperty` escrito à mão — dezenas de linhas que só repetem o que já está declarado logo ao lado.

---

## O que foi configurado

No `main.ts`, o `DocumentBuilder` monta título, versão, descrição e o esquema de autenticação:

```ts
.addBearerAuth()
```

> Adiciona o botão **Authorize** (cadeado) no topo da página. Sem ele não há como testar rota protegida pela interface.

```ts
SwaggerModule.setup('docs', app, documento, {
  swaggerOptions: { persistAuthorization: true },
});
```

> `persistAuthorization` mantém o token preenchido depois de recarregar a página. Sem isso, cada F5 obriga a colar o token de novo — irritante numa aula inteira de testes.

A descrição da API traz a **matriz de acesso completa** e o passo a passo de como autenticar. Quem abre `/docs` não precisa de nenhum outro documento para usar a API.

---

## O decorator `@ApiAutenticacao()`

Toda rota protegida documenta as mesmas duas respostas de erro. Em vez de repetir três linhas em cada método de cada controller — e esquecer em algum —, elas foram agrupadas:

```ts
export function ApiAutenticacao() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: 'Token ausente, invalido ou expirado' }),
    ApiResponse({ status: 403, description: 'Autenticado, mas sem permissao...' }),
  );
}
```

O `applyDecorators` do Nest combina vários decorators num só. Aplicado na **classe** do controller, vale para todos os métodos dele.

Documentar o `401` e o `403` é o que torna a matriz de acesso visível na interface. Uma documentação que só mostra o caminho feliz esconde justamente a parte mais difícil de entender da API.

---

## Roteiro de verificação manual

Abra `http://localhost:3000/docs` e percorra a matriz:

1. `POST /login` com o admin criado na fase 6 → copie o `access_token`
2. **Authorize** → cole o token
3. `GET /user` → 200, e confirme que **nenhum registro traz o campo `senha`**
4. `POST /user` com `"role": "admin"` no corpo → **400**
5. `POST /user` válido → 201, e confirme que o `role` voltou como `"user"`
6. Faça login com esse novo usuário e troque o token
7. `DELETE /user/:id` → **403** (não é admin)
8. `GET /address/:idDeOutroUsuario` → **403**
9. `GET /address/:seuProprioId` → 200
10. Volte para o token de admin e repita os passos 7 e 8 → **200** nos dois

Os passos que devem falhar são os mais importantes. Uma API que faz o caminho feliz mas não bloqueia o resto não está pronta — está apenas não testada.

---

## Estado do projeto

Fases 0 a 10 concluídas. A API está completa em relação à especificação: CRUD dos três recursos, autenticação JWT, RBAC por perfil, verificação de propriedade, tratamento de erros e documentação.

Fica para depois, quando o assunto for ensinado: testes automatizados (fase 11) e o fechamento do material do passo-a-passo (fase 12).
