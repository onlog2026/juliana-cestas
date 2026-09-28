"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateContent } from "@/modules/content/actions";
import type { StoreContent } from "@/modules/content/types";
import { ImageUploadField } from "@/components/admin/image-upload-field";

type Slot = StoreContent["promo_banners"]["wide"];

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function slotPayload(slot: Slot): Slot {
  return {
    imageUrl: slot.imageUrl,
    ...(slot.mobileImageUrl ? { mobileImageUrl: slot.mobileImageUrl } : {}),
    href: slot.href.trim(),
    alt: slot.alt.trim(),
  };
}

function SlotFields({
  title,
  hint,
  slot,
  onChange,
}: {
  title: string;
  hint: string;
  slot: Slot;
  onChange: (next: Slot) => void;
}) {
  return (
    <fieldset className="space-y-4 rounded-[12px] border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-foreground">{title}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>

      <ImageUploadField
        label="Imagem (computador e celular)"
        value={slot.imageUrl}
        onChange={(url) => onChange({ ...slot, imageUrl: url })}
      />
      <ImageUploadField
        label="Imagem só para o celular (opcional)"
        value={slot.mobileImageUrl ?? ""}
        onChange={(url) => onChange({ ...slot, mobileImageUrl: url || undefined })}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Link ao clicar (opcional)</span>
        <input
          value={slot.href}
          onChange={(e) => onChange({ ...slot, href: e.target.value })}
          placeholder="/categoria/frios  ou  https://…"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Descrição da imagem</span>
        <input
          value={slot.alt}
          onChange={(e) => onChange({ ...slot, alt: e.target.value.slice(0, 160) })}
          placeholder="Ex.: Cestas de Natal com 10% de desconto"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Lida por leitores de tela e usada pelo Google. Descreva o que a imagem mostra.
        </span>
      </label>
    </fieldset>
  );
}

/**
 * Editor dos 2 banners promocionais que ficam no meio da grade de produtos da
 * home (depois da 3ª linha): um largo e um estreito. Só imagens enviadas pelo
 * painel são aceitas (o servidor recusa outros endereços).
 */
export function ContentPromoBannersForm({ value }: { value: StoreContent["promo_banners"] }) {
  const [enabled, setEnabled] = useState(value.enabled);
  const [wide, setWide] = useState<Slot>(value.wide);
  const [narrow, setNarrow] = useState<Slot>(value.narrow);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (enabled && !wide.imageUrl && !narrow.imageUrl) {
      setError("Envie pelo menos uma imagem (ou desligue os banners).");
      return;
    }
    startTransition(async () => {
      const result = await updateContent("promo_banners", {
        enabled,
        wide: slotPayload(wide),
        narrow: slotPayload(narrow),
      });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Mostrar os banners na home</p>
          <p className="text-xs text-muted-foreground">
            Aparecem no meio da lista de cestas, depois da 3ª linha. Desligado, somem do site.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Mostrar os banners na home"
          onClick={() => {
            setEnabled((v) => !v);
            setSaved(false);
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-border"}`}
        >
          <span
            className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Esquema de como ficam no computador (no celular ficam um embaixo do outro). */}
      <div aria-hidden="true" className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-muted-foreground">
        <div className="col-span-2 flex aspect-[2/1] items-center justify-center rounded-[8px] border border-dashed border-border bg-secondary/40">
          Largo · 1600×800
        </div>
        <div className="flex items-center justify-center rounded-[8px] border border-dashed border-border bg-secondary/40">
          Estreito · 800×800
        </div>
      </div>

      <SlotFields
        title="Banner largo"
        hint="Ocupa 2/3 da largura no computador. Proporção 2:1 (ex.: 1600×800)."
        slot={wide}
        onChange={(s) => {
          setWide(s);
          setSaved(false);
        }}
      />
      <SlotFields
        title="Banner estreito"
        hint="Ocupa 1/3 da largura no computador, na mesma altura do largo. Quadrado (ex.: 800×800)."
        slot={narrow}
        onChange={(s) => {
          setNarrow(s);
          setSaved(false);
        }}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar banners"}
      </button>
    </form>
  );
}
