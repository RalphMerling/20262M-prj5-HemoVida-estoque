import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

/**
 * Junta num unico decorator tudo que vale para qualquer rota protegida:
 * o cadeado do Swagger e as duas respostas de erro que toda rota autenticada
 * pode devolver.
 *
 * Sem isto, as mesmas tres linhas se repetiriam em cada metodo de cada
 * controller -- e alguem esqueceria alguma.
 */
export function ApiAutenticacao() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiResponse({
      status: 401,
      description: 'Token ausente, invalido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description:
        'Autenticado, mas sem permissao para este recurso (perfil insuficiente ou registro de outro usuario)',
    }),
  );
}
