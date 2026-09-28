"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

type NavSubcategory = { slug: string; name: string; imageUrl: string | null };
type NavCategory = NavSubcategory & { children: NavSubcategory[] };

/**
 * Menu de categorias do celular (o do desktop é o HeaderNavMenu, hidden md:block).
 * Botão hambúrguer no header + gaveta que desliza da esquerda com as categorias e
 * subcategorias. Renderizado em portal no body para escapar do contexto de
 * empilhamento do header (sticky z-40) e ficar acima do BottomNav (fixed z-40).
 */
export function MobileNavMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal só existe no cliente; sem isto o primeiro render no servidor quebraria.
  useEffect(() => setMounted(true), []);

  // Enquanto aberto: Esc fecha e trava a rolagem do fundo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de categorias"
        aria-expanded={open}
        className="jc-nav-hover flex size-10 items-center justify-center rounded-full text-foreground md:hidden"
      >
        <Menu className="size-6" />
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Categorias">
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-foreground/40"
              />
              <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-display text-lg text-foreground">Categorias</span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                  {categories.map((cat) => (
                    <div key={cat.slug}>
                      <Link
                        href={`/categoria/${cat.slug}`}
                        onClick={() => setOpen(false)}
                        className="jc-nav-hover flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-foreground"
                      >
                        <span className="relative size-8 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
                          {cat.imageUrl ? (
                            <Image src={cat.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                          ) : null}
                        </span>
                        {cat.name}
                      </Link>
                      {cat.children.length > 0 ? (
                        <div className="ml-11 flex flex-col">
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/categoria/${sub.slug}`}
                              onClick={() => setOpen(false)}
                              className="jc-nav-hover rounded-[10px] px-3 py-2 text-sm text-muted-foreground"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </nav>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
