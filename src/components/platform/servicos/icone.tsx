import {
  Store, ShoppingBasket, Truck, Heart, CreditCard, Star, Boxes, Mail, Ticket, Search,
  Smartphone, LayoutDashboard, LayoutGrid, Building2, Plug, BellRing, Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Mapa nome -> ícone do lucide-react. Nome desconhecido cai em Sparkles (nunca quebra a página). */
const ICONES: Record<string, LucideIcon> = {
  Store, ShoppingBasket, Truck, Heart, CreditCard, Star, Boxes, Mail, Ticket, Search,
  Smartphone, LayoutDashboard, LayoutGrid, Building2, Plug, BellRing, Sparkles,
};

export function Icone({ nome, className, size = 22 }: { nome: string; className?: string; size?: number }) {
  const C = ICONES[nome] ?? Sparkles;
  return <C aria-hidden="true" className={className} size={size} strokeWidth={1.75} />;
}
