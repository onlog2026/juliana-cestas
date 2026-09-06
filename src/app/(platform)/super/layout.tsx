import Link from "next/link";
import { LayoutDashboard, Store, ScrollText, ShieldCheck } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { LogoutButton } from "@/components/admin/logout-button";
import { SuperNavDrawer } from "@/components/platform/super-nav-drawer";

// Nomes de ícone viajam como string até o drawer (client). Ver o comentário em
// super-nav-drawer.tsx: passar o componente quebra em produção.
const NAV_ITEMS = [
  { href: "/super", label: "Início", icon: LayoutDashboard, iconName: "LayoutDashboard" },
  { href: "/super/lojas", label: "Lojas", icon: Store, iconName: "Store" },
  { href: "/super/auditoria", label: "Auditoria", icon: ScrollText, iconName: "ScrollText" },
];

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  // Primeira coisa que acontece: quem não é dono da plataforma nem chega aqui.
  const admin = await requireSuperAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30 md:flex-row">
      {/* Barra do topo só no mobile -- o menu vira drawer, como num app. */}
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground md:hidden">
        <Link href="/super" className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          <span className="font-display text-lg">Plataforma</span>
        </Link>
        <SuperNavDrawer
          items={NAV_ITEMS.map(({ href, label, iconName }) => ({ href, label, iconName }))}
          adminEmail={admin.email}
        />
      </div>

      {/* Sidebar escura, de propósito: aqui não é o painel de uma loja, é o
          painel de quem administra TODAS elas. A cor vem do mesmo token de
          marca (primary), só invertida -- nada de paleta nova. */}
      <aside className="hidden shrink-0 md:flex md:w-56 md:flex-col md:bg-primary md:px-4 md:py-6 md:text-primary-foreground">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
            <ShieldCheck className="size-3.5" /> Plataforma
          </span>
          <Link href="/super" className="mt-3 block font-display text-lg text-primary-foreground">
            Administração
          </Link>
          <p className="text-xs text-primary-foreground/70">Todas as lojas</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
              >
                <Icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        {/* O bloco claro existe para o botão "Sair" (que usa as cores padrão do
            painel) continuar legível sobre a sidebar escura. */}
        <div className="mt-auto rounded-[10px] bg-card px-3 py-2.5">
          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
