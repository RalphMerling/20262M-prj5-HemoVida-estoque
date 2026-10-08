import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { EhLatin1 } from '../../common/validators/eh-latin1.validator';

export class UpdateAddressDto {
  @IsOptional()
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'cep deve ter 8 digitos, com ou sem hifen (ex.: 20031-170)',
  })
  cep?: string;

  @IsOptional() @IsString() @MaxLength(150) @EhLatin1()
  rua?: string;

  @IsOptional() @IsString() @MaxLength(20) @EhLatin1()
  numero?: string;

  @IsOptional() @IsString() @MaxLength(100) @EhLatin1()
  complemento?: string;

  @IsOptional() @IsString() @MaxLength(100) @EhLatin1()
  bairro?: string;

  @IsOptional() @IsString() @MaxLength(100) @EhLatin1()
  cidade?: string;

  @IsOptional()
  @Length(2, 2, { message: 'estado deve ter exatamente 2 letras (ex.: RJ)' })
  @Matches(/^[A-Z]{2}$/, { message: 'estado deve estar em maiusculas' })
  estado?: string;
}
