"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Store, ScrollText } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import type { LucideIcon } from "lucide-react";

// Mesma armadilha do drawer do painel da loja: um ícone (função React) NÃO
// atravessa a fronteira Server -> Client como prop. Passar o componente direto
// funciona no `npm run dev` e quebra a página inteira em produção -- nem o
// build nem o `tsc` pegam, porque é erro de serialização em tempo de execução.
// Por isso o layout manda só o NOME (string) e a resolução acontece aqui, que
// já é código de cliente.
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Store,
  ScrollText,
};

type NavItem = { href: string; label: string; iconName: string };

export function SuperNavDrawer({
  items,
  adminEmail,
}: {
  items: NavItem[];
  // Este componente é client e não lê o banco: o e-mail vem pronto do layout,
  // que já confirmou no servidor quem está logado.
  adminEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha sozinho ao navegar, do jeito que um app de verdade se comporta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu da plataforma"
        className="flex size-10 items-center justify-center rounded-full text-primary-foreground hover:bg-primary-foreground/15"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <nav className="jc-pop absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-primary px-4 py-6 text-primary-foreground shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-display text-lg text-primary-foreground">Plataforma</span>
                <p className="text-xs text-primary-foreground/70">Administração das lojas</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex size-9 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-primary-foreground/15"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = ICONS[item.iconName] ?? LayoutDashboard;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm font-medium ${
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "text-primary-foreground/85 hover:bg-primary-foreground/10"
                    }`}
                  >
                    <Icon className="size-5" /> {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto rounded-[10px] bg-card px-3 py-2.5">
              {adminEmail ? <p className="truncate text-xs text-muted-foreground">{adminEmail}</p> : null}
              <LogoutButton />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
