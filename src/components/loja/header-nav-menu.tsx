"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

type NavSubcategory = { slug: string; name: string; imageUrl: string | null };
type NavCategory = NavSubcategory & { children: NavSubcategory[] };

type HoverState = { category: NavCategory; left: number; top: number };

const POPOVER_WIDTH = 248;
// Tempo antes de fechar depois que o mouse sai de qualquer parte do menu --
// sem isso, o cursor "perde" o hover no vão entre o item e o card.
const CLOSE_DELAY_MS = 200;

export function HeaderNavMenu({ categories }: { categories: NavCategory[] }) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setHover(null), CLOSE_DELAY_MS);
  }

  function showPopover(category: NavCategory, trigger: HTMLElement) {
    cancelClose();
    if (category.children.length === 0) {
      setHover(null);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(center - POPOVER_WIDTH / 2, 8),
      window.innerWidth - POPOVER_WIDTH - 8
    );
    setHover({ category, left, top: rect.bottom + 6 });
  }

  if (categories.length === 0) return null;

  return (
    <nav className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2.5 text-sm font-medium text-foreground sm:px-6 lg:px-8">
      {categories.map((category) => (
        <div
          key={category.slug}
          onMouseEnter={(e) => showPopover(category, e.currentTarget)}
          onMouseLeave={scheduleClose}
        >
          <Link
            href={`/categoria/${category.slug}`}
            className="jc-nav-hover flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5"
          >
            {category.name}
            {category.children.length > 0 ? <ChevronDown className="size-3.5 text-muted-foreground" /> : null}
          </Link>
        </div>
      ))}

      {/* position:fixed de propósito -- o <nav> precisa de overflow-x-auto pra
          rolar em tela estreita, e o overflow-x força overflow-y "auto", que
          cortaria o card. "fixed" escapa desse corte (mesmo truque de antes). */}
      {hover ? (
        <div
          style={{ position: "fixed", left: hover.left, top: hover.top, width: POPOVER_WIDTH }}
          className="z-50 rounded-card border border-border bg-card p-2 shadow-lg"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <Link
            href={`/categoria/${hover.category.slug}`}
            onClick={() => setHover(null)}
            className="jc-nav-hover mb-1 block rounded-[10px] px-3 py-2 text-sm font-semibold text-primary"
          >
            Ver tudo em {hover.category.name}
          </Link>
          <div className="flex flex-col">
            {hover.category.children.map((sub) => (
              <Link
                key={sub.slug}
                href={`/categoria/${sub.slug}`}
                onClick={() => setHover(null)}
                className="jc-nav-hover flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-foreground"
              >
                <span className="relative size-8 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
                  {sub.imageUrl ? (
                    <Image src={sub.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 truncate">{sub.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
