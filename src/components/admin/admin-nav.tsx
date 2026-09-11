"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  CreditCard,
  Wallet,
  Globe,
  Zap,
  Boxes,
  Images,
  Shapes,
  ShoppingCart,
  ShoppingBag,
  Store,
  Megaphone,
  Star,
  Tag,
  Users,
  Package,
  Truck,
  Search,
  LayoutTemplate,
  ShoppingBasket,
  LayoutDashboard,
  Ticket,
  Settings,
  Headset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminMenuItem, GroupedAdminMenu } from "@/lib/modules/registry";

/**
 * Menu do painel da loja, agrupado em departamentos (Vendas, Catálogo, etc.),
 * no estilo "guarda-chuva" do Agentop. É um só componente, usado tanto na
 * barra lateral do desktop quanto no drawer do mobile — a mesma fonte de dados
 * (`GroupedAdminMenu`, montada no servidor a partir do registro) desenha nos
 * dois lugares, então nunca divergem.
 *
 * Ícones ficam AQUI (client): passar a função do ícone de um componente de
 * servidor como prop quebra a página em produção (erro de serialização que o
 * tsc/build não pegam). Por isso o servidor manda só o NOME do ícone (string)
 * e a resolução para componente acontece neste arquivo.
 */
const ICONS: Record<string, LucideIcon> = {
  CreditCard,
  Wallet,
  Globe,
  Zap,
  Boxes,
  Images,
  Shapes,
  ShoppingCart,
  ShoppingBag,
  Store,
  Megaphone,
  Star,
  Tag,
  Users,
  Package,
  Truck,
  Search,
  LayoutTemplate,
  ShoppingBasket,
  LayoutDashboard,
  Ticket,
  Settings,
  Headset,
};

// Uma cor por departamento (só um toque no ícone e na linha lateral), para
// diferenciar visualmente sem brigar com a paleta verde/dourada da loja.
const ACCENT_TEXT: Record<string, string> = {
  vendas: "text-emerald-600",
  catalogo: "text-amber-600",
  marketing: "text-rose-500",
  loja: "text-indigo-500",
  financeiro: "text-green-700",
  config: "text-slate-500",
};
const ACCENT_BORDER: Record<string, string> = {
  vendas: "border-emerald-200",
  catalogo: "border-amber-200",
  marketing: "border-rose-200",
  loja: "border-indigo-200",
  financeiro: "border-green-200",
  config: "border-slate-200",
};

function isActivePath(pathname: string, href: string): boolean {
  // "Início" (/admin) só casa exato; senão qualquer rota do painel o marcaria.
  // Os demais casam a sub-rota também (ex.: /admin/pedidos/123 marca "Pedidos").
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: AdminMenuItem; active: boolean }) {
  const Icon = ICONS[item.iconName] ?? LayoutDashboard;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-primary" : "text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="size-4 shrink-0" /> <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

export function AdminNav({ menu }: { menu: GroupedAdminMenu }) {
  const pathname = usePathname();

  // Qual departamento contém a rota atual — começa aberto por padrão.
  const activeGroupId =
    menu.groups.find((g) => g.items.some((i) => isActivePath(pathname, i.href)))?.id ?? null;

  // Estado de aberto/fechado por grupo. Sem entrada explícita, usa o default
  // (aberto se contém a rota atual). Assim a lojista já cai com o setor certo
  // aberto, mas pode expandir/recolher os outros à vontade.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex flex-col gap-1">
      {menu.standalone.map((item) => (
        <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
      ))}

      {menu.groups.map((group) => {
        const GroupIcon = ICONS[group.iconName] ?? LayoutDashboard;
        const isOpen = open[group.id] ?? group.id === activeGroupId;
        const accentText = ACCENT_TEXT[group.id] ?? "text-muted-foreground";
        const accentBorder = ACCENT_BORDER[group.id] ?? "border-border";
        return (
          <div key={group.id} className="mt-1.5">
            <button
              type="button"
              onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent"
            >
              <GroupIcon className={`size-4 shrink-0 ${accentText}`} />
              <span className="flex-1 text-left">{group.label}</span>
              <ChevronDown
                className={`size-3.5 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
            </button>
            {isOpen ? (
              <div className={`ml-4 mt-0.5 flex flex-col gap-0.5 border-l-2 pl-2 ${accentBorder}`}>
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
