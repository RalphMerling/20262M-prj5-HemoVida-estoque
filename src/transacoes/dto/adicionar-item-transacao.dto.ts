
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AdicionarItemTransacaoDto {
  @IsInt()
  @Min(1)
  estoque_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  destino!: string;
}
