import {
  BarChart3,
  CircleDollarSign,
  ExternalLink,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Palette,
  ScrollText,
  Settings,
  Store,
  Tags,
  Ticket,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Nome do ícone (texto) -> componente.
 *
 * Existe porque o menu (`src/lib/platform/super-nav.ts`) guarda só o NOME. Um
 * ícone do lucide é uma função React e não atravessa a fronteira
 * Server -> Client como prop: funciona no `npm run dev` e derruba a página em
 * produção, sem o build nem o `tsc` acusarem nada.
 */
export const SUPER_NAV_ICONS: Record<string, LucideIcon> = {
  BarChart3,
  CircleDollarSign,
  ExternalLink,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Palette,
  ScrollText,
  Settings,
  Store,
  Tags,
  Ticket,
  TriangleAlert,
  Users,
};

export function superNavIcon(name: string): LucideIcon {
  return SUPER_NAV_ICONS[name] ?? LayoutDashboard;
}
