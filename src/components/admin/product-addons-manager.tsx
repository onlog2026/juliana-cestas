"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProductAddon, upsertProductAddon } from "@/modules/catalog/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { reaisToCents } from "@/components/admin/delivery-zone-edit-form";
import type { DbProductAddonAdmin } from "@/modules/catalog/service";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Draft = { name: string; price: string; groupName: string; note: string; imageUrl: string; active: boolean };

function toDraft(a?: DbProductAddonAdmin): Draft {
  return {
    name: a?.name ?? "",
    price: a ? (a.price_cents / 100).toFixed(2).replace(".", ",") : "",
    groupName: a?.group_name ?? "",
    note: a?.note ?? "",
    imageUrl: a?.image_url ?? "",
    active: a?.active ?? true,
  };
}

function AddonForm({
  productId,
  addon,
  groups,
  onDone,
}: {
  productId: string;
  addon?: DbProductAddonAdmin;
  groups: string[];
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(addon));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = draft.price.trim() ? reaisToCents(draft.price) : 0;
    if (Number.isNaN(cents) || cents < 0) {
      setError("Informe um preço válido.");
      return;
    }
    startTransition(async () => {
      const r = await upsertProductAddon({
        id: addon?.id,
        productId,
        name: draft.name,
        priceCents: cents,
        groupName: draft.groupName,
        note: draft.note,
        imageUrl: draft.imageUrl,
        active: draft.active,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <ImageUploadField label="Foto (opcional)" value={draft.imageUrl} onChange={(u) => set("imageUrl", u)} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Nome</span>
        <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Ex.: 1 Foto Polaroid Imã" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Preço (R$)</span>
          <input value={draft.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" placeholder="9,00" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Seção</span>
          <input
            value={draft.groupName}
            onChange={(e) => set("groupName", e.target.value)}
            list="addon-groups"
            placeholder="Ex.: Fotos, Bolos"
            className={inputClass}
            maxLength={40}
          />
          <datalist id="addon-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Observação (opcional)</span>
        <input value={draft.note} onChange={(e) => set("note", e.target.value)} className={inputClass} placeholder="Ex.: Personalizado" maxLength={60} />
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="size-4 rounded border-border" />
        Ativo (aparece pro cliente)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Salvar
        </button>
        <button type="button" onClick={onDone} className="flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ProductAddonsManager({ productId, addons }: { productId: string; addons: DbProductAddonAdmin[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groups = Array.from(new Set(addons.map((a) => a.group_name).filter((g): g is string => Boolean(g))));

  function done() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  function remove(id: string) {
    setError(null);
    setConfirmingId(null);
    startTransition(async () => {
      const r = await deleteProductAddon(id, productId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {addons.length === 0 && !creating ? (
        <p className="rounded-[10px] border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhum adicional ainda. Adicione fotos, bolos, embalagens… o cliente escolhe quantos quiser na hora de comprar.
        </p>
      ) : null}

      {addons.map((a) =>
        editingId === a.id ? (
          <AddonForm key={a.id} productId={productId} addon={a} groups={groups} onDone={done} />
        ) : (
          <div key={a.id} className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
              {a.image_url ? <Image src={a.image_url} alt="" fill sizes="48px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {a.group_name ? `${a.group_name} · ` : ""}
                {brl.format(a.price_cents / 100)}
                {a.note ? ` · ${a.note}` : ""}
                {a.active ? "" : " · Inativo"}
              </p>
            </div>
            {confirmingId === a.id ? (
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => remove(a.id)} disabled={pending} className="flex h-8 items-center rounded-full bg-destructive px-3 text-xs font-semibold text-white disabled:opacity-60">
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Sim, excluir"}
                </button>
                <button type="button" onClick={() => setConfirmingId(null)} className="flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground hover:bg-accent">
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setEditingId(a.id)} aria-label="Editar" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setConfirmingId(a.id)} aria-label="Excluir" className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        )
      )}

      {creating ? (
        <AddonForm productId={productId} groups={groups} onDone={done} />
      ) : (
        <button type="button" onClick={() => setCreating(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent">
          <Plus className="size-4" /> Novo adicional
        </button>
      )}
    </div>
  );
}
