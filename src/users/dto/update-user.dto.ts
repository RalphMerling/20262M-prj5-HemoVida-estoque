import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  ROLE_ADMIN,
  ROLE_USER,
} from '../../auth/tipos/usuario-autenticado';
import { EhLatin1 } from '../../common/validators/eh-latin1.validator';

/**
 * Diferente do cadastro, aqui `role` EXISTE -- mas so um admin consegue
 * usa-lo. Quem verifica isso e o UsersService, porque a regra depende de quem
 * esta fazendo a requisicao, e nao da forma do payload.
 *
 * Todos os campos sao opcionais: um PUT que mude apenas o telefone nao deve
 * exigir o reenvio da senha.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @EhLatin1()
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email deve ser um endereco valido' })
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72, {
    message: 'senha deve ter no maximo 72 caracteres (limite do bcrypt)',
  })
  senha?: string;

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

  @IsOptional()
  @IsIn([ROLE_USER, ROLE_ADMIN], {
    message: `role deve ser "${ROLE_USER}" ou "${ROLE_ADMIN}"`,
  })
  role?: string;
}
