"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { deleteBanner, reorderBanners } from "@/modules/banners/actions";
import { BannerEditForm } from "@/components/admin/banner-edit-form";
import type { Banner } from "@/modules/banners/service";

export function BannersManager({ banners: initialBanners }: { banners: Banner[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState(initialBanners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSaved() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
    startTransition(() => {
      reorderBanners(next.map((b) => b.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este banner? Não dá pra desfazer.")) return;
    setBanners((current) => current.filter((b) => b.id !== id));
    startTransition(() => {
      deleteBanner(id);
    });
  }

  return (
    <div className="space-y-3">
      {banners.map((banner, index) =>
        editingId === banner.id ? (
          <BannerEditForm
            key={banner.id}
            banner={banner}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={banner.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
              {banner.image ? (
                <Image src={banner.image} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{banner.text}</p>
              <p className="text-xs text-muted-foreground">
                {banner.active ? "Ativo" : "Inativo"} · {banner.href}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || pending}
                aria-label="Mover para cima"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === banners.length - 1 || pending}
                aria-label="Mover para baixo"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(banner.id)}
                aria-label="Editar"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(banner.id)}
                aria-label="Excluir"
                className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          </div>
        )
      )}

      {creating ? (
        <BannerEditForm onSaved={handleSaved} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Novo banner
        </button>
      )}
    </div>
  );
}
