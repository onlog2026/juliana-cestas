"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertBanner, type BannerInput } from "@/modules/banners/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { Banner } from "@/modules/banners/service";

type Draft = {
  image: string;
  href: string;
  text: string;
  top: string;
  left: string;
  maxWidth: string;
  objectPosition: string;
  textAlign: "left" | "center" | "right";
  active: boolean;
};

function toDraft(banner?: Banner): Draft {
  return {
    image: banner?.image ?? "",
    href: banner?.href ?? "/categoria/cafe-da-manha",
    text: banner?.text ?? "",
    top: String(banner?.textPosition.top ?? 40),
    left: String(banner?.textPosition.left ?? 6),
    maxWidth: String(banner?.textPosition.maxWidth ?? 60),
    objectPosition: banner?.objectPosition ?? "50% 50%",
    textAlign: banner?.textAlign ?? "left",
    active: banner?.active ?? true,
  };
}

export function BannerEditForm({
  banner,
  onSaved,
  onCancel,
}: {
  banner?: Banner;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(banner));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: BannerInput = {
      id: banner?.id,
      slug: banner?.slug ?? draft.text,
      image: draft.image,
      href: draft.href,
      text: draft.text,
      top: Number(draft.top) || 0,
      left: Number(draft.left) || 0,
      maxWidth: Number(draft.maxWidth) || 60,
      objectPosition: draft.objectPosition,
      textAlign: draft.textAlign,
      active: draft.active,
    };
    startTransition(async () => {
      const result = await upsertBanner(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <ImageUploadField label="Imagem do banner" value={draft.image} onChange={(url) => set("image", url)} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Texto</span>
        <input
          value={draft.text}
          onChange={(e) => set("text", e.target.value)}
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Link ao clicar</span>
        <input
          value={draft.href}
          onChange={(e) => set("href", e.target.value)}
          placeholder="/categoria/cafe-da-manha"
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Texto: topo (%)</span>
          <input
            value={draft.top}
            onChange={(e) => set("top", e.target.value)}
            inputMode="numeric"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Texto: esquerda (%)</span>
          <input
            value={draft.left}
            onChange={(e) => set("left", e.target.value)}
            inputMode="numeric"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Largura máx. (%)</span>
          <input
            value={draft.maxWidth}
            onChange={(e) => set("maxWidth", e.target.value)}
            inputMode="numeric"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Enquadramento da foto</span>
          <input
            value={draft.objectPosition}
            onChange={(e) => set("objectPosition", e.target.value)}
            placeholder="50% 50%"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Alinhamento do texto</span>
          <select
            value={draft.textAlign}
            onChange={(e) => set("textAlign", e.target.value as Draft["textAlign"])}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-4 rounded border-border"
        />
        Ativo (aparece no carrossel da home)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
