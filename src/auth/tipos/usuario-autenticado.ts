/**
 * O que o JwtAuthGuard coloca em request.user depois de validar o token.
 * E tambem o formato do payload assinado no login.
 */
export interface UsuarioAutenticado {
  sub: number;
  email: string;
  role: string;
}

export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
