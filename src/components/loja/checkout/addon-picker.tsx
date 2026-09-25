"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { formatCents } from "@/lib/money";
import { MAX_ADDON_QTY, countBySlug, groupByName } from "@/modules/checkout/addon-qty";
import type { DbProductAddon } from "@/modules/catalog/service";

/**
 * Lista de adicionais: seções (FOTOS, BOLOS…), cada item com miniatura, nome,
 * observação, preço e botão "+" (vira − n + depois de escolhido). Toque grande
 * (44px) e sem depender de hover. `slugs` é a lista do carrinho, onde o slug
 * repetido é a quantidade.
 */
export function AddonPicker({
  addons,
  slugs,
  onAdd,
  onRemove,
}: {
  addons: DbProductAddon[];
  slugs: string[];
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
}) {
  const counts = countBySlug(slugs);
  const groups = groupByName(addons);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      {groups.map((group) => (
        <div key={group.name}>
          <h3 className="bg-secondary/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {group.name}
          </h3>
          <ul className="divide-y divide-border">
            {group.items.map((addon) => {
              const qty = counts.get(addon.slug) ?? 0;
              const full = qty >= MAX_ADDON_QTY;
              return (
                <li key={addon.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                    {addon.image_url ? (
                      <Image src={addon.image_url} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">{addon.name}</p>
                    {addon.note ? <p className="text-xs text-muted-foreground">{addon.note}</p> : null}
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                      +{formatCents(addon.price_cents)}
                    </p>
                  </div>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => onAdd(addon.slug)}
                      aria-label={`Adicionar ${addon.name}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent active:scale-95"
                    >
                      <Plus className="size-5" />
                    </button>
                  ) : (
                    <div className="flex h-11 shrink-0 items-center rounded-full border border-primary bg-primary/5">
                      <button
                        type="button"
                        onClick={() => onRemove(addon.slug)}
                        aria-label={`Tirar um ${addon.name}`}
                        className="flex size-11 items-center justify-center rounded-full text-primary active:scale-95"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-foreground" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdd(addon.slug)}
                        disabled={full}
                        aria-label={`Adicionar mais um ${addon.name}`}
                        className="flex size-11 items-center justify-center rounded-full text-primary active:scale-95 disabled:opacity-40"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
