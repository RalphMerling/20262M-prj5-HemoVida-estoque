import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UsuarioAutenticado } from '../tipos/usuario-autenticado';

/**
 * Injeta o usuario do token direto no parametro do controller, evitando
 * `@Req() req` e o acesso a `req.user` sem tipagem espalhados pelo codigo.
 */
// export const UsuarioAtual = createParamDecorator(
//   (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
//     const requisicao = contexto
//       .switchToHttp()
//       .getRequest<Request & { user: UsuarioAutenticado }>();

//     return requisicao.user;
//   },
// );

export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    return contexto.switchToHttp().getRequest().user;
  },
);