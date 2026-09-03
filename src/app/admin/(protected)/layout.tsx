import Link from "next/link";
import {
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
import { requireStaff } from "@/lib/auth/require-staff";
import { LogoutButton } from "@/components/admin/logout-button";
import { MobileNavDrawer } from "@/components/admin/mobile-nav-drawer";

const NAV_ITEMS = [
  { href: "/admin", label: "Início", icon: LayoutDashboard, iconName: "LayoutDashboard" },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package, iconName: "Package" },
  { href: "/admin/entregas", label: "Entregas", icon: Truck, iconName: "Truck" },
  { href: "/admin/atendimento", label: "Atendimento", icon: Headset, iconName: "Headset" },
  { href: "/admin/produtos", label: "Produtos", icon: ShoppingBasket, iconName: "ShoppingBasket" },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket, iconName: "Ticket" },
  { href: "/admin/cms", label: "CMS", icon: LayoutTemplate, iconName: "LayoutTemplate" },
  { href: "/admin/seo", label: "SEO", icon: Search, iconName: "Search" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, iconName: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30 md:flex-row">
      {/* Barra do topo só no mobile -- o menu vira um drawer, do jeito que
          um app de verdade se comporta, em vez de espremer 8 itens numa
          linha horizontal. */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link href="/admin" className="font-display text-lg text-primary">
          Juliana Cestas
        </Link>
        <MobileNavDrawer
          items={NAV_ITEMS.map(({ href, label, iconName }) => ({ href, label, iconName }))}
          staffEmail={staff.email}
        />
      </div>

      <aside className="hidden shrink-0 md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
        <div>
          <Link href="/admin" className="font-display text-lg text-primary">
            Juliana Cestas
          </Link>
          <p className="text-xs text-muted-foreground">Painel de gestão</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
