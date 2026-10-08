# Convenções do passo-a-passo

**Projeto:** NodeNestPrisma

## Regra principal: terminal primeiro

O aluno **executa comandos**. Ele só escreve arquivo à mão quando não existe comando que o produza.

Isso não é preciosismo de ferramenta. Quem digita `nest g service prisma` aprende que o framework tem um gerador, vê o arquivo aparecer já registrado no módulo e ganha um hábito que serve para o resto da carreira. Quem copia e cola um arquivo pronto aprende a copiar e colar.

| Situação | Como fica no passo-a-passo |
|---|---|
| Existe comando (`nest g`, `npm i`, `prisma db pull`, `npm pkg set`) | O comando é o passo. O conteúdo gerado é mostrado e explicado depois |
| Não existe comando (regra de negócio, DTO, validação, lógica de service) | O aluno escreve o arquivo, com o código no material |
| Comando gera um esqueleto que precisa de conteúdo | Comando primeiro, depois o que editar dentro dele |

## Regra 2: todo comando vem explicado

Nenhum comando aparece no material sem dizer **o que ele faz**. Não basta mandar digitar.

Ruim:

```
npm i --save-exact bcrypt@6.0.0
```

Bom:

```
npm i --save-exact bcrypt@6.0.0
```

> Instala a biblioteca que gera e confere o hash das senhas.
> `--save-exact` grava `"6.0.0"` no `package.json` em vez de `"^6.0.0"` — assim
> toda a turma usa exatamente a mesma versão, e ninguém pega uma atualização no
> meio do semestre.

O aluno precisa conseguir responder, depois da aula, por que digitou aquilo. Um comando sem explicação vira superstição: funciona, ninguém sabe por quê, e no primeiro erro ninguém sabe o que mexer.

Isso vale especialmente para as flags. `--save-exact`, `--no-spec`, `--from-schema`, `-D` — cada uma existe por um motivo, e é nas flags que mora a maior parte do aprendizado real de ferramenta.

## O que isso implica na prática

- Dependências entram por `npm install`, nunca editando o `package.json` na mão
- Scripts do `package.json` entram por `npm pkg set`
- Módulos, controllers, services, guards, filtros e decorators entram por `nest g`
- Os modelos do Prisma vêm de `prisma db pull` (introspecção do banco real), não digitados a partir do DDL
- `.env`, arquivos de configuração do TypeScript e regras de negócio são escritos à mão

## Nota sobre a construção deste projeto

Vários arquivos das fases 1 a 3 foram criados diretamente, porque o ambiente de automação usado na montagem não tinha acesso à porta 3306 nem ao domínio de onde o Prisma baixa seus binários.

Isso é uma limitação da montagem, **não** do passo-a-passo. Cada fase documenta o comando equivalente na seção "Gerando pela CLI", e é esse comando que vai para o material do aluno.
