import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Rejeita textos com caracteres que a coluna latin1 do banco nao consegue
 * armazenar -- emoji, ideogramas, simbolos fora do ISO-8859-1.
 *
 * Por que isso existe: as tabelas deste projeto usam latin1_swedish_ci e o
 * MySQL 5.7 roda em sql_mode estrito. Sem esta validacao, um emoji no nome
 * viraria o erro 1366 (Incorrect string value) la no banco, e o usuario
 * receberia um 500 sem explicacao. Com ela, recebe um 400 dizendo o que houve.
 */
export function EhLatin1(options?: ValidationOptions) {
  return function (objeto: object, propriedade: string): void {
    registerDecorator({
      name: 'ehLatin1',
      target: objeto.constructor,
      propertyName: propriedade,
      options,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') {
            return true; // tipo errado e problema de outro validador
          }
          return [...valor].every((caractere) => caractere.charCodeAt(0) <= 255);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contem caracteres que o banco nao consegue armazenar (emoji ou simbolos fora do latin1)`;
        },
      },
    });
  };
}
