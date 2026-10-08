import { SetMetadata } from '@nestjs/common';

export const CHAVE_PUBLICA = 'rotaPublica';

/**
 * Marca uma rota como aberta, dispensando o token.
 *
 * O JwtAuthGuard esta registrado globalmente: por padrao TUDO exige token.
 * Isso inverte o risco a favor da seguranca -- esquecer de proteger uma rota
 * nao deixa um buraco aberto; esquecer de liberar uma rota publica aparece no
 * primeiro teste.
 */
export const Public = () => SetMetadata(CHAVE_PUBLICA, true);
