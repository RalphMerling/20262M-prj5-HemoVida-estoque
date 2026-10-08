import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { CHAVE_ROLES } from '../decorators/roles.decorator';
import { UsuarioAutenticado } from '../tipos/usuario-autenticado';

/**
 * Cuida apenas das regras que dependem SO do papel -- por exemplo, "somente
 * admin pode apagar usuario".
 *
 * As regras de propriedade ("admin OU o proprio dono") nao passam por aqui:
 * elas precisam do registro carregado do banco e ficam no service, no helper
 * garantirDonoOuAdmin.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesExigidas = this.reflector.getAllAndOverride<string[]>(
      CHAVE_ROLES,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (!rolesExigidas || rolesExigidas.length === 0) {
      return true;
    }

    const requisicao = contexto
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();

    const usuario = requisicao.user;

    if (!usuario || !rolesExigidas.includes(usuario.role)) {
      throw new ForbiddenException(
        `Esta operacao exige um dos perfis: ${rolesExigidas.join(', ')}`,
      );
    }

    return true;
  }
}
