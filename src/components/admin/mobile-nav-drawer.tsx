"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

export function MobileNavDrawer({ items, staffEmail }: { items: NavItem[]; staffEmail: string | null }) {
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
          <nav className="jc-pop absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card px-4 py-6 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-primary">Juliana Cestas</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm font-medium ${
                      active ? "bg-accent text-primary" : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="size-5" /> {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto pt-6">
              {staffEmail ? <p className="truncate text-xs text-muted-foreground">{staffEmail}</p> : null}
              <LogoutButton />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
