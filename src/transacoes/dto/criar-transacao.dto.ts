
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarTransacaoDto {
  @IsInt()
  @Min(1)
  transacao_id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  transacao_tipo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  solicitacao_id?: number;
}
