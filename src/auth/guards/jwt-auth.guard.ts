import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { CHAVE_PUBLICA } from '../decorators/public.decorator';
import { UsuarioAutenticado } from '../tipos/usuario-autenticado';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // getAllAndOverride olha primeiro o metodo, depois a classe: assim um
    // @Public() no metodo vence a configuracao do controller inteiro.
    const ehPublica = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (ehPublica) {
      return true;
    }

    const requisicao = contexto
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();

    const token = this.extrairToken(requisicao);

    if (!token) {
      throw new UnauthorizedException(
        'Token nao informado. Use o cabecalho Authorization: Bearer <token>',
      );
    }

    try {
      requisicao.user = await this.jwt.verifyAsync<UsuarioAutenticado>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      // A mensagem e deliberadamente generica: dizer se o token expirou ou se
      // a assinatura e invalida entrega informacao util a quem esta atacando.
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    return true;
  }

  private extrairToken(requisicao: Request): string | undefined {
    const cabecalho = requisicao.headers.authorization;

    if (!cabecalho) {
      return undefined;
    }

    const [tipo, token] = cabecalho.split(' ');

    return tipo === 'Bearer' ? token : undefined;
  }
}
