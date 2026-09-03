import Link from "next/link";
import { Package, Truck, Search, LayoutTemplate, ShoppingBasket } from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { LogoutButton } from "@/components/admin/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30 md:flex-row">
      <aside className="flex shrink-0 flex-row items-center justify-between border-b border-border bg-card px-4 py-3 md:w-56 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
        <div>
          <Link href="/admin/pedidos" className="font-display text-lg text-primary">
            Juliana Cestas
          </Link>
          <p className="hidden text-xs text-muted-foreground md:block">Painel de gestão</p>
        </div>

        <nav className="flex items-center gap-1 md:mt-8 md:flex-col md:items-stretch md:gap-1">
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent md:rounded-[10px]"
          >
            <Package className="size-4" /> Pedidos
          </Link>
          <Link
            href="/admin/entregas"
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent md:rounded-[10px]"
          >
            <Truck className="size-4" /> Entregas
          </Link>
          <Link
            href="/admin/seo"
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent md:rounded-[10px]"
          >
            <Search className="size-4" /> SEO
          </Link>
          <Link
            href="/admin/produtos"
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent md:rounded-[10px]"
          >
            <ShoppingBasket className="size-4" /> Produtos
          </Link>
          <Link
            href="/admin/cms"
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground hover:bg-accent md:rounded-[10px]"
          >
            <LayoutTemplate className="size-4" /> CMS
          </Link>
        </nav>

        <div className="hidden md:mt-auto md:block md:pt-8">
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
