import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[\d\s()+-]{8,30}$/, {
    message:
      'numeroTelefone aceita apenas digitos, espacos, parenteses, + e - (8 a 30 caracteres)',
  })
  numeroTelefone?: string;
}
