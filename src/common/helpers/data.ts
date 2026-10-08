/**
 * Converte "1990-05-17" em um Date na meia-noite UTC.
 *
 * Por que UTC explicito: `new Date('1990-05-17')` ja e interpretado como UTC,
 * mas `new Date(1990, 4, 17)` usaria o fuso local -- e como o Brasil esta em
 * UTC-3, a data gravada no banco viraria o dia anterior. Como a coluna e DATE
 * (sem hora), esse deslocamento seria invisivel ate alguem reparar que todo
 * mundo nasceu um dia antes.
 */
export function paraDataUtc(valor?: string): Date | undefined {
  if (!valor) {
    return undefined;
  }

  return new Date(`${valor}T00:00:00.000Z`);
}
