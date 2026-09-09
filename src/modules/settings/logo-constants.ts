/**
 * Constantes do tamanho da logo do cabeçalho, num arquivo À PARTE de
 * `site-settings.ts` de propósito: aquele arquivo tem `import "server-only"`,
 * e um componente de CLIENTE (`header-logo-editable.tsx`) precisa ler estes
 * números para desenhar o controle deslizante. Importar QUALQUER coisa de um
 * arquivo marcado `server-only` -- mesmo só uma constante -- quebra o build
 * assim que algo do lado do cliente importa esse arquivo (mesmo erro já visto
 * neste projeto com `BANNER_TEXT_MAX_LENGTH`; a correção é a mesma: mover a
 * constante para um arquivo sem essa marca).
 */
export const LOGO_HEADER_HEIGHT_DEFAULT = 80;
export const LOGO_HEADER_HEIGHT_MIN = 32;
export const LOGO_HEADER_HEIGHT_MAX = 140;
