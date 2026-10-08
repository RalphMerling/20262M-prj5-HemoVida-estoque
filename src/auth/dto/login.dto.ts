import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email deve ser um endereco valido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'senha e obrigatoria' })
  senha!: string;
}
