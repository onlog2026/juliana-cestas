// Lógica PURA das flags e tarjas de promoção (sem banco, sem React): fácil de testar
// e usada tanto pela vitrine quanto pelo painel.

export type FlagDef = { id: string; label: string; bg: string; text: string; enabled: boolean };
export type DiscountFlag = { enabled: boolean; bg: string; text: string };
export type FlagsConfig = { items: FlagDef[]; discount: DiscountFlag };

/** A tarja como a vitrine desenha. */
export type Ribbon = { label: string; bg: string; text: string };

/** Modelos prontos que aparecem na primeira vez (o dono muda cores e nomes). */
export const DEFAULT_FLAGS: FlagsConfig = {
  items: [
    { id: "promocao", label: "Promoção", bg: "#b3261e", text: "#ffffff", enabled: true },
    { id: "black-friday", label: "Black Friday", bg: "#111111", text: "#f5c518", enabled: true },
    { id: "dia-das-maes", label: "Dia das Mães", bg: "#c2185b", text: "#ffffff", enabled: true },
    { id: "novo", label: "Novo", bg: "#556b2f", text: "#ffffff", enabled: true },
    { id: "ultimas-unidades", label: "Últimas unidades", bg: "#d9a441", text: "#1f2a24", enabled: true },
  ],
  discount: { enabled: true, bg: "#b3261e", text: "#ffffff" },
};

/**
 * Percentual de desconto ("de 300 por 259" -> 14). Só existe quando o preço
 * "de" é MAIOR que o preço atual; arredonda para o inteiro mais próximo e nunca
 * devolve 0% (desconto menor que 0,5% não vira tarja).
 */
export function discountPercent(priceCents: number, compareAtCents: number | null | undefined): number | null {
  if (!compareAtCents || compareAtCents <= priceCents || priceCents <= 0) return null;
  const pct = Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
  return pct >= 1 ? pct : null;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores #rrggbb (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Cor de texto (branco ou quase-preto) com melhor contraste sobre o fundo. */
export function readableTextOn(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#1f2a24") ? "#ffffff" : "#1f2a24";
}

/** Contraste abaixo de 3:1 (mínimo WCAG para texto grande/negrito) merece aviso no painel. */
export function hasLowContrast(bg: string, text: string): boolean {
  return contrastRatio(bg, text) < 3;
}

/**
 * Qual tarja o produto mostra (UMA só, decisão do dono):
 *  1. a flag escolhida no produto, se existir e estiver ligada;
 *  2. senão, a automática de desconto ("-14%"), se houver preço "de/por" e ela estiver ligada;
 *  3. senão, nenhuma.
 */
export function resolveRibbon(
  product: { priceCents: number; compareAtCents?: number | null; flagId?: string | null },
  config: FlagsConfig
): Ribbon | null {
  if (product.flagId) {
    const flag = config.items.find((f) => f.id === product.flagId && f.enabled);
    if (flag) return { label: flag.label, bg: flag.bg, text: flag.text };
  }
  const pct = discountPercent(product.priceCents, product.compareAtCents);
  if (pct !== null && config.discount.enabled) {
    return { label: `-${pct}%`, bg: config.discount.bg, text: config.discount.text };
  }
  return null;
}

/** id estável a partir do nome ("Dia das Mães" -> "dia-das-maes"), único dentro da lista. */
export function slugifyFlagId(label: string, taken: string[]): string {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "flag";
  let id = base;
  let n = 2;
  while (taken.includes(id)) id = `${base}-${n++}`;
  return id;
}
