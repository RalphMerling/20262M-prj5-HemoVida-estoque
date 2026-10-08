import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Formato esperado das variaveis de ambiente.
 *
 * A validacao roda no boot da aplicacao. Se algo estiver faltando ou errado,
 * a API nao sobe -- e melhor falhar no start do que descobrir em producao que
 * o JWT estava sendo assinado com um segredo vazio.
 */
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL e obrigatoria' })
  @Matches(/^mysql:\/\//, {
    message: 'DATABASE_URL deve comecar com mysql://',
  })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET deve ter no minimo 32 caracteres. Gere um com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
  })
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^\d+(ms|s|m|h|d)$/, {
    message: 'JWT_EXPIRES_IN deve ser algo como 15m, 1h ou 7d',
  })
  JWT_EXPIRES_IN!: string;

  @IsInt({ message: 'PORT deve ser um numero inteiro' })
  @Min(1)
  @Max(65535)
  PORT!: number;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validado = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: false,
  });

  const erros = validateSync(validado, { skipMissingProperties: false });

  if (erros.length > 0) {
    const detalhes = erros
      .map((erro) => Object.values(erro.constraints ?? {}).join('; '))
      .join('\n  - ');

    throw new Error(
      `Configuracao invalida. Revise o seu arquivo .env:\n  - ${detalhes}\n`,
    );
  }

  return validado;
}
