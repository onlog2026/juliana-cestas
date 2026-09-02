export type CardTemplate = {
  slug: string;
  name: string;
  paperClass: string;
  borderClass: string;
  icon: "none" | "leaf" | "sparkles" | "heart" | "party";
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
  },
  {
    slug: "dourado",
    name: "Dourado",
    paperClass: "bg-[#fbf6ea]",
    borderClass: "border-[var(--jc-gold)]",
    icon: "sparkles",
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
  },
  {
    slug: "festivo",
    name: "Festivo",
    paperClass: "bg-[var(--jc-paper)]",
    borderClass: "border-[var(--jc-gold)]",
    icon: "party",
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
