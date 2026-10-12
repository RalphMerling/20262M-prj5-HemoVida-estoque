
import { IsInt, Min } from 'class-validator';

export class RegistrarEntradaEstoqueDto {
  @IsInt()
  @Min(1)
  bolsa_id!: number;
}
