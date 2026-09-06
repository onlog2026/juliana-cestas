/**
 * TEMA DA LOJA — os mesmos nomes de variável do `src/app/globals.css`.
 *
 * Regra desta camada: o modelo NUNCA inventa nome de cor. Ele só escolhe um
 * valor diferente para uma variável que o site inteiro já usa (`--primary`,
 * `--background`, `--jc-gold`...). Assim, trocar de modelo repinta a loja
 * inteira sem que nenhum componente saiba que existe modelo.
 *
 * As FONTES saem de um conjunto fixo, já carregado por `next/font` em
 * `src/app/layout.tsx`. Nunca há `<link>` para o Google Fonts e nunca há fonte
 * baixada em tempo de execução: o `next/font` já baixou, hospedou e gerou o
 * `font-display: swap` no build. Fonte carregada na hora derruba a nota de
 * performance e pisca texto na tela do cliente.
 */

/**
 * Toda variável que um modelo pode repintar. É EXATAMENTE a lista que existe
 * no `:root` do globals.css — nada aqui é nome novo.
 */
export const THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "radius",
  "jc-radius-card",
  "jc-gold",
  "jc-whatsapp",
  "jc-success",
  "jc-shadow",
  "jc-paper",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
export type ThemeTokens = Partial<Record<ThemeTokenKey, string>>;

const TOKEN_KEY_SET: ReadonlySet<string> = new Set(THEME_TOKEN_KEYS);

/**
 * As quatro fontes que o site já carrega. Acrescentar uma quinta é acrescentar
 * um `next/font` em `src/app/layout.tsx` E uma linha aqui — nas duas pontas,
 * nunca só aqui.
 */
export const THEME_FONTS = [
  { key: "figtree", label: "Figtree (texto limpo)", cssVar: "var(--font-figtree)" },
  { key: "young-serif", label: "Young Serif (títulos com serifa)", cssVar: "var(--font-young-serif)" },
  { key: "playfair", label: "Playfair Display (elegante)", cssVar: "var(--font-playfair)" },
  { key: "poppins", label: "Poppins (amigável)", cssVar: "var(--font-poppins)" },
] as const;

export type ThemeFontKey = (typeof THEME_FONTS)[number]["key"];

/** Que fonte serve o corpo do texto e que fonte serve os títulos. */
export type ThemeFonts = {
  /** Corpo do texto — vira `--font-sans`. */
  sans: ThemeFontKey;
  /** Títulos — vira `--font-display`. */
  display: ThemeFontKey;
};

export function fontCssVar(key: string): string {
  return THEME_FONTS.find((f) => f.key === key)?.cssVar ?? THEME_FONTS[0].cssVar;
}

export function fontLabel(key: string): string {
  return THEME_FONTS.find((f) => f.key === key)?.label ?? THEME_FONTS[0].label;
}

/**
 * Valor de token aceitável.
 *
 * O valor vem do painel da lojista, e o resultado vai para dentro de uma tag
 * `<style>`. Sem esta trava, um valor com `}` fecha o bloco e escreve CSS
 * arbitrário na loja inteira; um valor com `<` fecha a tag e escreve HTML.
 *
 * Recusar `>` e aspas também resolve um problema conhecido do React: CSS com
 * esses caracteres dentro de `<style>{...}` quebra a hidratação (erros #418 /
 * #423 / #425). Cor, raio e sombra nunca precisam desses caracteres.
 */
const VALOR_PROIBIDO = /[<>{}"'\;@]|url\s*\(|expression\s*\(|\/\*|\*\//i;

export function isValidTokenValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.length > 120) return false;
  return !VALOR_PROIBIDO.test(v);
}

/** Fica só com as chaves conhecidas e os valores que passam na trava acima. */
export function sanitizeTokens(input: unknown): ThemeTokens {
  if (!input || typeof input !== "object") return {};
  const out: ThemeTokens = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!TOKEN_KEY_SET.has(key)) continue;
    if (!isValidTokenValue(value)) continue;
    out[key as ThemeTokenKey] = value.trim();
  }
  return out;
}

export function isThemeFontKey(value: unknown): value is ThemeFontKey {
  return typeof value === "string" && THEME_FONTS.some((f) => f.key === value);
}

export function sanitizeFonts(input: unknown): ThemeFonts {
  const raw = (input ?? {}) as Record<string, unknown>;
  return {
    sans: isThemeFontKey(raw.sans) ? raw.sans : "figtree",
    display: isThemeFontKey(raw.display) ? raw.display : "young-serif",
  };
}

/**
 * Gera o CSS que o layout injeta num `<style>`.
 *
 * A saída é determinística (sempre na ordem de THEME_TOKEN_KEYS) — de
 * propósito: assim o HTML do servidor e o do navegador batem caractere por
 * caractere, e o React não acusa diferença de hidratação.
 *
 * Devolve string vazia quando não há nada válido para escrever: melhor não
 * injetar tag nenhuma do que injetar `:root{}`.
 */
export function themeToCss(
  tokens: unknown,
  fonts?: unknown,
  options?: { selector?: string }
): string {
  const selector = options?.selector ?? ":root";
  const safe = sanitizeTokens(tokens);

  const linhas: string[] = [];
  for (const key of THEME_TOKEN_KEYS) {
    const value = safe[key];
    if (value !== undefined) linhas.push(`--${key}:${value}`);
  }

  if (fonts !== undefined && fonts !== null) {
    const f = sanitizeFonts(fonts);
    linhas.push(`--font-sans:${fontCssVar(f.sans)}`);
    linhas.push(`--font-display:${fontCssVar(f.display)}`);
  }

  if (linhas.length === 0) return "";
  return `${selector}{${linhas.join(";")}}`;
}
