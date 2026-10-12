
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RegistrarSaidaEstoqueDto {
  @IsInt()
  @Min(1)
  estoque_id!: number;

  @IsInt()
  @Min(1)
  transacao_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  destino!: string;
}
