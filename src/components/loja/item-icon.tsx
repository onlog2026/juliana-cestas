import {
  Apple,
  Cake,
  Candy,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  Egg,
  Flower2,
  Gift,
  Grape,
  IceCream2,
  MessageSquareHeart,
  Milk,
  PartyPopper,
  Salad,
  Sandwich,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícone (lucide, traço fino) para cada item de "O que vem na cesta", escolhido pela
 * PALAVRA no nome ("queijos nobres" -> Milk, "vinho tinto" -> Wine). Sem palavra
 * conhecida, cai no presente (Gift): a lista nunca fica sem ícone nem quebra.
 * Sem emoji: tudo do mesmo pacote e do mesmo traço (regra "design sem cara de IA").
 */
const RULES: Array<[RegExp, LucideIcon]> = [
  [/vinho|espumante|champanhe|cerveja|drink|licor|suco de uva/i, Wine],
  [/queijo|leite|iogurte|requeij|manteiga|frios|patê|pate/i, Milk],
  [/p[aã]o|p[aã]es|croissant|torrada|baguete|brioche|waffle|panqueca/i, Croissant],
  [/bolo|torta|cupcake|brownie/i, Cake],
  [/chocolate|bombom|trufa|doce|geleia|mel\b|nutella|balas?|confeito/i, Candy],
  [/biscoito|cookie|bolacha|castanha|amendoa|amêndoa|noz|nozes|petisco/i, Cookie],
  [/caf[eé]|ch[aá]\b|cappuccino|capuccino|expresso/i, Coffee],
  [/uva|frutas? vermelh|morango|cereja|cranberry/i, Grape],
  [/fruta|ma[cç][aã]|banana|laranja|kiwi|melancia|abacaxi|damasco|tâmara|tamara/i, Apple],
  [/morango|cereja/i, Cherry],
  [/azeitona|salada|tomate|vegetal|folha|azeite/i, Salad],
  [/sandu[ií]che|lanche|salgad|pastel|coxinha|mini pizza/i, Sandwich],
  [/ovo|omelete/i, Egg],
  [/sorvete|gelato|picol[eé]/i, IceCream2],
  [/flor|buqu[eê]|orqu[ií]dea|rosa|arranjo|kalanchoe|kolanchoe|planta/i, Flower2],
  [/bal[aã]o|balões|festa|vela|confete/i, PartyPopper],
  [/cart[aã]o|bilhete|mensagem|carta|dedicat/i, MessageSquareHeart],
];

export function iconForItem(name: string): LucideIcon {
  for (const [pattern, icon] of RULES) {
    if (pattern.test(name)) return icon;
  }
  return Gift;
}

export function ItemIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconForItem(name);
  return <Icon aria-hidden="true" className={className} strokeWidth={1.6} />;
}
