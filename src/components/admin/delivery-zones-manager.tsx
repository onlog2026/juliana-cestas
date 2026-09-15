"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2, X } from "lucide-react";
import {
  deleteDeliveryZone,
  reorderDeliveryZones,
  addCepRange,
  deleteCepRange,
} from "@/modules/delivery/zone-actions";
import { DeliveryZoneEditForm } from "@/components/admin/delivery-zone-edit-form";
import type { DeliveryZoneAdmin, CepRange } from "@/modules/delivery/settings";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cepInput =
  "h-9 w-32 rounded-[8px] border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** 72010000 -> "72010-000" */
function fmtCep(n: number): string {
  const s = String(n).padStart(8, "0");
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}
function parseCepToInt(raw: string): number | null {
  const d = raw.replace(/\D/g, "");
  return d.length === 8 ? Number.parseInt(d, 10) : null;
}
function prazoLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} dias`;
  return `até ${max ?? min} dias`;
}

export function DeliveryZonesManager({
  zones: initialZones,
  ranges,
}: {
  zones: DeliveryZoneAdmin[];
  ranges: CepRange[];
}) {
  const router = useRouter();
  const [zones, setZones] = useState<DeliveryZoneAdmin[]>(initialZones);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setZones(initialZones);
  }, [initialZones]);

  const rangesByZone = useMemo(() => {
    const map = new Map<string, CepRange[]>();
    for (const r of ranges) {
      const list = map.get(r.zoneId) ?? [];
      list.push(r);
      map.set(r.zoneId, list);
    }
    return map;
  }, [ranges]);

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
          um com o valor do frete e as faixas de CEP.
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
        const prazo = prazoLabel(zone.prazo_min_days, zone.prazo_max_days);
        return (
          <div key={zone.id} className="rounded-[10px] border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{zone.name}</p>
                <p className="text-xs text-muted-foreground">
                  {zone.fee_cents > 0 ? brl.format(zone.fee_cents / 100) : "Frete grátis"}
                  {prazo ? ` · ${prazo}` : ""}
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

            <ZoneCepRanges zoneId={zone.id} ranges={rangesByZone.get(zone.id) ?? []} />
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

/** Faixas de CEP de uma área: chips com remover + um "+ faixa" para adicionar. */
function ZoneCepRanges({ zoneId, ranges }: { zoneId: string; ranges: CepRange[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    const s = parseCepToInt(start);
    const e = parseCepToInt(end);
    if (s == null || e == null) {
      setError("Informe o CEP inicial e final com 8 dígitos.");
      return;
    }
    if (e < s) {
      setError("O CEP final precisa ser maior ou igual ao inicial.");
      return;
    }
    startTransition(async () => {
      const r = await addCepRange(zoneId, s, e);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setStart("");
      setEnd("");
      setAdding(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteCepRange(id);
      router.refresh();
    });
  }

  return (
    <div className="mt-2.5 border-t border-border pt-2.5">
      <p className="text-xs font-medium text-muted-foreground">Faixas de CEP atendidas</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {ranges.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Nenhuma faixa. Sem faixa, o CEP não cai nesta área.
          </span>
        ) : (
          ranges.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground"
            >
              {fmtCep(r.cepStart)} a {fmtCep(r.cepEnd)}
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={pending}
                aria-label="Remover faixa"
                className="text-muted-foreground hover:text-destructive disabled:opacity-40"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
        {adding ? null : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="size-3" /> faixa
          </button>
        )}
      </div>

      {adding ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="CEP inicial"
            inputMode="numeric"
            maxLength={9}
            className={cepInput}
          />
          <span className="text-xs text-muted-foreground">a</span>
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="CEP final"
            inputMode="numeric"
            maxLength={9}
            className={cepInput}
          />
          <button
            type="button"
            onClick={add}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Adicionar
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError(null);
            }}
            className="flex h-9 items-center rounded-full border border-border px-4 text-xs font-medium text-foreground hover:bg-accent"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
