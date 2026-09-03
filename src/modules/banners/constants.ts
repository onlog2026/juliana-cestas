/**
 * Fica fora de actions.ts de propósito: um arquivo "use server" só pode
 * exportar funções assíncronas (Server Actions) -- uma constante ali quebra
 * o módulo inteiro na hora do build.
 */
export const BANNER_TEXT_MAX_LENGTH = 100;
