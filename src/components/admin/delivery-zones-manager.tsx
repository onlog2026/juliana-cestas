"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import {
  deleteDeliveryZone,
  reorderDeliveryZones,
} from "@/modules/delivery/zone-actions";
import { DeliveryZoneEditForm } from "@/components/admin/delivery-zone-edit-form";
import type { DeliveryZoneAdmin } from "@/modules/delivery/settings";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DeliveryZonesManager({ zones: initialZones }: { zones: DeliveryZoneAdmin[] }) {
  const router = useRouter();
  const [zones, setZones] = useState<DeliveryZoneAdmin[]>(initialZones);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Depois de salvar, o servidor manda a lista nova; re-sincroniza.
  useEffect(() => {
    setZones(initialZones);
  }, [initialZones]);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= zones.length) return;
    const next = [...zones];
    [next[index], next[target]] = [next[target], next[index]];
    setZones(next);
    startTransition(() => {
      reorderDeliveryZones(next.map((z) => z.id));
    });
  }

  function handleSaved() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  function handleDelete(id: string) {
    setError(null);
    setConfirmingId(null);
    startTransition(async () => {
      const result = await deleteDeliveryZone(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setZones((current) => current.filter((z) => z.id !== id));
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {zones.length === 0 && !creating ? (
        <p className="rounded-[10px] border border-dashed border-border p-4 text-sm text-muted-foreground">
          Você ainda não cadastrou nenhuma área de entrega. Adicione os bairros e regiões que você atende, cada
          um com o valor do frete.
        </p>
      ) : null}

      {zones.map((zone, index) => {
        if (editingId === zone.id) {
          return (
            <DeliveryZoneEditForm
              key={zone.id}
              zone={zone}
              onSaved={handleSaved}
              onCancel={() => setEditingId(null)}
            />
          );
        }
        return (
          <div
            key={zone.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{zone.name}</p>
              <p className="text-xs text-muted-foreground">
                {zone.fee_cents > 0 ? brl.format(zone.fee_cents / 100) : "Frete grátis"}
                {zone.active ? "" : " · Inativa"}
              </p>
            </div>

            {confirmingId === zone.id ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">Excluir?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(zone.id)}
                  disabled={pending}
                  className="flex h-8 items-center rounded-full bg-destructive px-3 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Sim, excluir"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            ) : (
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
                  disabled={index === zones.length - 1 || pending}
                  aria-label="Mover para baixo"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(zone.id)}
                  aria-label="Editar"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(zone.id)}
                  aria-label="Excluir"
                  className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {creating ? (
        <DeliveryZoneEditForm onSaved={handleSaved} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Nova área de entrega
        </button>
      )}
    </div>
  );
}
