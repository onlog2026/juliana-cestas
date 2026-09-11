"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import type { GroupedAdminMenu } from "@/lib/modules/registry";

export function MobileNavDrawer({
  menu,
  staffEmail,
  storeName,
}: {
  menu: GroupedAdminMenu;
  staffEmail: string | null;
  // Este componente é client e não pode ler o banco -- o nome da loja vem
  // pronto do layout (server), que já sabe qual loja é a de quem está logado.
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha sozinho ao navegar -- do jeito que um app de verdade se comporta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-accent"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="jc-pop absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card px-4 py-6 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-primary">{storeName || "Painel de gestão"}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
              <AdminNav menu={menu} />
            </div>

            <div className="mt-auto pt-6">
              {staffEmail ? <p className="truncate text-xs text-muted-foreground">{staffEmail}</p> : null}
              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
