import {
  IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';

import { EhLatin1 } from '../../common/validators/eh-latin1.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'nome e obrigatorio' })
  @MaxLength(120)
  @EhLatin1()
  nome!: string;

  @IsEmail({}, { message: 'email deve ser um endereco valido' })
  @MaxLength(150)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'senha deve ter no minimo 8 caracteres' })
  @MaxLength(72, { message: 'senha deve ter no maximo 72 caracteres (limite do bcrypt)' })
  senha!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dataNascimento deve estar no formato AAAA-MMDD'
})
  dataNascimento?: string;


  @IsOptional() @IsString() @MaxLength(20) @EhLatin1()
  rg?: string;

  @IsOptional() @IsString() @MaxLength(20) @EhLatin1()
  cpf?: string;

  @IsOptional() @IsString() @MaxLength(255) @EhLatin1()
  nomeMae?: string;
}