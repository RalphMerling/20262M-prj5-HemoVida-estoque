
import { IsIn, IsInt } from 'class-validator';

export class AtualizarStatusEstoqueDto {
  @IsInt()
  @IsIn([0, 1], {
    message: 'O status deve ser 0 (indisponível) ou 1 (disponível)',
  })
  estoque_status!: number;
}
