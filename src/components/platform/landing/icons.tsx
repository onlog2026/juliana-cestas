import {
  Gift,
  Flower2,
  Cake,
  Palette,
  Store,
  ShoppingBag,
  Package,
  Heart,
  Sparkles,
  LayoutDashboard,
  Wallet,
  CreditCard,
  Globe,
  ImagePlus,
  ChartColumn,
  Truck,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Rocket,
} from "lucide-react";
import type { PlatformIconName } from "@/modules/platform/landing-content";

/**
 * Nome do ícone → componente.
 *
 * O payload guarda a STRING e a resolução acontece aqui. Nunca se passa um
 * componente de ícone como propriedade de um componente de servidor para um
 * de cliente: o build passa e a produção cai.
 */
const MAPA: Record<PlatformIconName, React.ComponentType<{ className?: string }>> = {
  Gift,
  Flower2,
  Cake,
  Palette,
  Store,
  ShoppingBag,
  Package,
  Heart,
  Sparkles,
  LayoutDashboard,
  Wallet,
  CreditCard,
  Globe,
  ImagePlus,
  ChartColumn,
  Truck,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Rocket,
};

/** Desenha o ícone pelo nome. Nome desconhecido não quebra a página: cai no genérico. */
export function PlatformIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAPA[name as PlatformIconName] ?? Sparkles;
  return <Icon className={className} />;
}
