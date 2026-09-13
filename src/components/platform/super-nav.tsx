"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { superNavIcon } from "@/components/platform/super-nav-icons";

type NavItem = { href: string; label: string; iconName: string; external?: boolean };
type NavGroup = { id: string; label: string; iconName: string; items: NavItem[] };

// Um toque de cor por departamento (só o ícone), que aparece bem sobre a
// sidebar escura sem inventar paleta nova.
const ACCENT: Record<string, string> = {
  lojas: "text-emerald-300",
  vitrine: "text-amber-300",
  operacao: "text-rose-300",
  config: "text-sky-300",
};

function isActive(pathname: string, href: string, external?: boolean): boolean {
  if (external) return false;
  if (href === "/super") return pathname === "/super";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ItemLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = superNavIcon(item.iconName);
  return (
    <Link
      href={item.href}
      title={item.external ? undefined : item.label}
      aria-current={active ? "page" : undefined}
      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`flex min-h-10 items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-foreground/20 text-primary-foreground"
          : "text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

export function SuperNav({ standalone, groups }: { standalone: NavItem; groups: NavGroup[] }) {
  const pathname = usePathname();
  const activeGroupId = groups.find((g) => g.items.some((i) => isActive(pathname, i.href, i.external)))?.id ?? null;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex flex-col gap-1">
      <ItemLink item={standalone} active={isActive(pathname, standalone.href)} />

      {groups.map((group) => {
        const GroupIcon = superNavIcon(group.iconName);
        const isOpen = open[group.id] ?? group.id === activeGroupId;
        const accent = ACCENT[group.id] ?? "text-primary-foreground/70";
        return (
          <div key={group.id} className="mt-1.5">
            <button
              type="button"
              onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[11px] font-bold tracking-wider text-primary-foreground/60 uppercase transition-colors hover:bg-primary-foreground/10"
            >
              <GroupIcon className={`size-4 shrink-0 ${accent}`} />
              <span className="flex-1 text-left">{group.label}</span>
              <ChevronDown className={`size-3.5 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
            </button>
            {isOpen ? (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l-2 border-primary-foreground/15 pl-2">
                {group.items.map((item) => (
                  <ItemLink key={item.href} item={item} active={isActive(pathname, item.href, item.external)} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
