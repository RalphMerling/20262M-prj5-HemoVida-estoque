import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateContactDto {
  /**
   * Aceita formatos comuns no Brasil: "21999998888", "(21) 99999-8888",
   * "+55 21 99999-8888". A coluna e VARCHAR(30).
   */
  @IsString()
  @MaxLength(30)
  @Matches(/^[\d\s()+-]{8,30}$/, {
    message:
      'numeroTelefone aceita apenas digitos, espacos, parenteses, + e - (8 a 30 caracteres)',
  })
  numeroTelefone!: string;
}
