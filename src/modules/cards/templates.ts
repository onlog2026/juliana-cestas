/**
 * Modelos de cartãozinho. Cada tema novo tem LAYOUT PRÓPRIO (ilustração no topo
 * e no rodapé, saudação, papel, moldura e tipografia) -- ver
 * `components/loja/card-face.tsx`, que é quem desenha. Aqui só mora o dado.
 *
 * Os modelos antigos (clássico, botânico…) continuam existindo em
 * `LEGACY_TEMPLATES` só para pedidos já feitos com eles continuarem lindos;
 * não aparecem mais na escolha.
 */
export type CardThemeKey =
  | "aniversario"
  | "bodas"
  | "natal"
  | "pascoa"
  | "maes"
  | "pais"
  | "filhos"
  | "reveillon"
  | "namorados";

export type CardTemplate = {
  slug: string;
  name: string;
  /** Presente nos temas novos. Ausente = modelo antigo (só cor + padrão). */
  theme?: CardThemeKey;
  /** Saudação impressa no topo do cartão (temas novos). */
  greeting?: string;
  // ── modelo antigo ────────────────────────────────────────────────────────
  paperClass: string;
  borderClass: string;
  icon: "none" | "leaf" | "sparkles" | "heart" | "party" | "rings";
  /** Cor (hex) do padrão de fundo — só usada quando icon !== "none". */
  accentColor?: string;
};

/** Os temas que a lojista deixa disponíveis, na ordem em que aparecem. */
export const CARD_TEMPLATES: CardTemplate[] = [
  { slug: "aniversario", name: "Aniversário", theme: "aniversario", greeting: "Feliz Aniversário!", paperClass: "", borderClass: "", icon: "none" },
  { slug: "bodas", name: "Bodas", theme: "bodas", greeting: "Parabéns pelas Bodas!", paperClass: "", borderClass: "", icon: "none" },
  { slug: "natal", name: "Natal", theme: "natal", greeting: "Feliz Natal!", paperClass: "", borderClass: "", icon: "none" },
  { slug: "pascoa", name: "Páscoa", theme: "pascoa", greeting: "Feliz Páscoa!", paperClass: "", borderClass: "", icon: "none" },
  { slug: "maes", name: "Mães", theme: "maes", greeting: "Feliz Dia das Mães", paperClass: "", borderClass: "", icon: "none" },
  { slug: "pais", name: "Pais", theme: "pais", greeting: "Feliz Dia dos Pais", paperClass: "", borderClass: "", icon: "none" },
  { slug: "filhos", name: "Filhos", theme: "filhos", greeting: "Feliz Dia dos Filhos", paperClass: "", borderClass: "", icon: "none" },
  { slug: "reveillon", name: "Réveillon", theme: "reveillon", greeting: "Feliz Ano Novo!", paperClass: "", borderClass: "", icon: "none" },
  { slug: "namorados", name: "Namorados", theme: "namorados", greeting: "Feliz Dia dos Namorados", paperClass: "", borderClass: "", icon: "none" },
];

/** Modelos antigos: só para exibir pedidos já feitos. Não são escolhíveis. */
export const LEGACY_TEMPLATES: CardTemplate[] = [
  { slug: "classico", name: "Clássico", paperClass: "bg-[var(--jc-paper)]", borderClass: "border-[color-mix(in_oklch,var(--primary),transparent_80%)]", icon: "none" },
  { slug: "botanico", name: "Botânico", paperClass: "bg-[var(--jc-paper)]", borderClass: "border-primary/60", icon: "leaf", accentColor: "#556b2f" },
  { slug: "dourado", name: "Dourado", paperClass: "bg-[#fbf6ea]", borderClass: "border-[var(--jc-gold)]", icon: "sparkles", accentColor: "#d9a441" },
  { slug: "minimal", name: "Minimal", paperClass: "bg-[#fffdf9]", borderClass: "border-transparent border-b-[color-mix(in_oklch,var(--primary),transparent_70%)]", icon: "none" },
  { slug: "afeto", name: "Afeto", paperClass: "bg-[#f9ece8]", borderClass: "border-[#b86b6b]/40", icon: "heart", accentColor: "#b86b6b" },
  { slug: "festivo", name: "Festivo", paperClass: "bg-[var(--jc-paper)]", borderClass: "border-[var(--jc-gold)]", icon: "party", accentColor: "#d9a441" },
  { slug: "casamento", name: "Casamento", paperClass: "bg-[#fbf9f2]", borderClass: "border-[#cbb27a]/55", icon: "rings", accentColor: "#cbb27a" },
];

export const DEFAULT_CARD_TEMPLATE = "aniversario";

/** Acha o modelo pelo slug, inclusive os antigos. Desconhecido cai no primeiro. */
export function getCardTemplate(slug: string): CardTemplate {
  return (
    CARD_TEMPLATES.find((t) => t.slug === slug) ??
    LEGACY_TEMPLATES.find((t) => t.slug === slug) ??
    CARD_TEMPLATES[0]
  );
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
