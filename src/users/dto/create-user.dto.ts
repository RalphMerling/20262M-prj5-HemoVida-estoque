import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { EhLatin1 } from '../../common/validators/eh-latin1.validator';

/**
 * Repare no que NAO existe aqui: o campo `role`.
 *
 * A rota de cadastro e publica. Se `role` estivesse no DTO, qualquer pessoa
 * poderia se cadastrar como admin. Como o ValidationPipe roda com
 * `forbidNonWhitelisted: true`, mandar "role" no corpo devolve 400 -- o campo
 * nao e ignorado em silencio, e recusado.
 *
 * Os limites de tamanho batem exatamente com os VARCHAR do banco. Isso e
 * proposital: o MySQL 5.7 esta em sql_mode estrito e recusaria a gravacao,
 * gerando um 500. Validando aqui, o usuario recebe um 400 explicando o motivo.
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'nome e obrigatorio' })
  @MaxLength(120)
  @EhLatin1()
  nome!: string;

  @IsEmail({}, { message: 'email deve ser um endereco valido' })
  @MaxLength(150)
  email!: string;

  /**
   * O maximo de 72 nao e arbitrario: o bcrypt ignora tudo depois do 72o byte.
   * Sem esse limite, "senha de 80 caracteres" e "os mesmos 72 primeiros
   * caracteres" seriam a mesma senha -- e ninguem perceberia.
   */
  @IsString()
  @MinLength(8, { message: 'senha deve ter no minimo 8 caracteres' })
  @MaxLength(72, {
    message: 'senha deve ter no maximo 72 caracteres (limite do bcrypt)',
  })
  senha!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dataNascimento deve estar no formato AAAA-MM-DD',
  })
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @EhLatin1()
  rg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @EhLatin1()
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @EhLatin1()
  nomeMae?: string;
}
