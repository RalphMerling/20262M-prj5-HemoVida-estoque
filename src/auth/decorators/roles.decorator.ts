import { SetMetadata } from '@nestjs/common';

export const CHAVE_ROLES = 'rolesExigidas';

/** Exige que o usuario autenticado tenha uma das roles listadas. */
export const Roles = (...roles: string[]) => SetMetadata(CHAVE_ROLES, roles);
