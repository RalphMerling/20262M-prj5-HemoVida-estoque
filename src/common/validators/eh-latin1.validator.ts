import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function EhLatin1(options?: ValidationOptions) {
  return function (objeto: object, propriedade: string): void {
    registerDecorator({
      name: 'ehLatin1',
      target: objeto.constructor,
      propertyName: propriedade,
      options,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') return true;
          return [...valor].every((c) => c.charCodeAt(0) <= 255);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contem caracteres que o banco nao consegue armazenar (emoji ou simbolos fora do latin1)`;
        },
      },
    });
  };
}