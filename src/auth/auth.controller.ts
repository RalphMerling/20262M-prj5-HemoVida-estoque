import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * POST /login
   *
   * `@HttpCode(200)` porque o padrao do Nest para POST e 201 (Created) -- e
   * aqui nao se cria recurso nenhum, apenas se autentica.
   *
   * O limite de 5 tentativas por minuto por IP transforma um ataque de forca
   * bruta de "minutos" em "anos". E a protecao mais barata que existe para
   * uma rota de login.
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
