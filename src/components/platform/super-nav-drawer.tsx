"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { SuperNav } from "@/components/platform/super-nav";

type NavItem = { href: string; label: string; iconName: string; external?: boolean };
type NavGroup = { id: string; label: string; iconName: string; items: NavItem[] };

export function SuperNavDrawer({
  standalone,
  groups,
  adminEmail,
}: {
  standalone: NavItem;
  groups: NavGroup[];
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
            <div className="flex shrink-0 items-center justify-between">
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

            {/* Rola por dentro: são ~14 telas, não cabem na altura do celular. */}
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
              <SuperNav standalone={standalone} groups={groups} />
            </div>

            <div className="mt-2 shrink-0 rounded-[10px] bg-card px-3 py-2.5">
              {adminEmail ? <p className="truncate text-xs text-muted-foreground">{adminEmail}</p> : null}
              <LogoutButton />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
