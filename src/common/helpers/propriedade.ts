import { ForbiddenException } from '@nestjs/common';

import {
  ROLE_ADMIN,
  UsuarioAutenticado,
} from '../../auth/tipos/usuario-autenticado';

/**
 * Regra de propriedade usada em quase toda a API: ou voce e admin, ou voce e o
 * dono do recurso.
 *
 * Por que isto vive num helper e nao num guard: para /address/:id e
 * /contact/:id o dono so e conhecido depois de carregar o registro do banco --
 * e o service ja vai carrega-lo de qualquer forma. Um guard faria uma segunda
 * consulta para descobrir a mesma coisa.
 */
export function garantirDonoOuAdmin(
  usuario: UsuarioAutenticado,
  idDoDono: number,
): void {
  if (usuario.role === ROLE_ADMIN) return;
  if (usuario.sub === idDoDono) return;

  throw new ForbiddenException(
    'Voce so pode acessar os seus proprios registros',
  );
}

export function ehAdmin(usuario: UsuarioAutenticado): boolean {
  return usuario.role === ROLE_ADMIN;
}
