export type CardTemplate = {
  slug: string;
  name: string;
  paperClass: string;
  borderClass: string;
  icon: "none" | "leaf" | "sparkles" | "heart" | "party" | "rings";
  /** Cor (hex) do padrão de fundo — só usada quando icon !== "none". */
  accentColor?: string;
};

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    slug: "classico",
    name: "Clássico",
    paperClass: "bg-[var(--jc-paper)]",
    borderClass: "border-[color-mix(in_oklch,var(--primary),transparent_80%)]",
    icon: "none",
  },
  {
    slug: "botanico",
    name: "Botânico",
    paperClass: "bg-[var(--jc-paper)]",
    borderClass: "border-primary/60",
    icon: "leaf",
    accentColor: "#556b2f",
  },
  {
    slug: "dourado",
    name: "Dourado",
    paperClass: "bg-[#fbf6ea]",
    borderClass: "border-[var(--jc-gold)]",
    icon: "sparkles",
    accentColor: "#d9a441",
  },
  {
    slug: "minimal",
    name: "Minimal",
    paperClass: "bg-[#fffdf9]",
    borderClass: "border-transparent border-b-[color-mix(in_oklch,var(--primary),transparent_70%)]",
    icon: "none",
  },
  {
    slug: "afeto",
    name: "Afeto",
    paperClass: "bg-[#f9ece8]",
    borderClass: "border-[#b86b6b]/40",
    icon: "heart",
    accentColor: "#b86b6b",
  },
  {
    slug: "festivo",
    name: "Festivo",
    paperClass: "bg-[var(--jc-paper)]",
    borderClass: "border-[var(--jc-gold)]",
    icon: "party",
    accentColor: "#d9a441",
  },
  {
    slug: "namorados",
    name: "Namorados",
    paperClass: "bg-[#fbeeee]",
    borderClass: "border-[#c65d5d]/45",
    icon: "heart",
    accentColor: "#c65d5d",
  },
  {
    slug: "aniversario",
    name: "Aniversário",
    paperClass: "bg-[#fdf3e4]",
    borderClass: "border-[#e0a95e]/50",
    icon: "party",
    accentColor: "#e0a95e",
  },
  {
    slug: "casamento",
    name: "Casamento",
    paperClass: "bg-[#fbf9f2]",
    borderClass: "border-[#cbb27a]/55",
    icon: "rings",
    accentColor: "#cbb27a",
  },
];

export const DEFAULT_CARD_TEMPLATE = "classico";

export function getCardTemplate(slug: string): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.slug === slug) ?? CARD_TEMPLATES[0];
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
