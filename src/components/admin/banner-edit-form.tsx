"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertBanner, type BannerInput } from "@/modules/banners/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { BannerLivePreview } from "@/components/admin/banner-live-preview";
import { BANNER_FONTS } from "@/lib/fonts";
import type { Banner } from "@/modules/banners/service";

type Draft = {
  image: string;
  href: string;
  text: string;
  top: number;
  left: number;
  maxWidth: number;
  objectPosition: string;
  textAlign: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  active: boolean;
};

function toDraft(banner?: Banner): Draft {
  return {
    image: banner?.image ?? "",
    href: banner?.href ?? "/categoria/cafe-da-manha",
    text: banner?.text ?? "",
    top: banner?.textPosition.top ?? 40,
    left: banner?.textPosition.left ?? 6,
    maxWidth: banner?.textPosition.maxWidth ?? 60,
    objectPosition: banner?.objectPosition ?? "50% 50%",
    textAlign: banner?.textAlign ?? "left",
    fontSize: banner?.fontSize ?? 32,
    fontFamily: banner?.fontFamily ?? "display",
    fontColor: banner?.fontColor ?? "#ffffff",
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

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
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
      top: draft.top,
      left: draft.left,
      maxWidth: draft.maxWidth,
      objectPosition: draft.objectPosition,
      textAlign: draft.textAlign,
      fontSize: draft.fontSize,
      fontFamily: draft.fontFamily,
      fontColor: draft.fontColor,
      active: draft.active,
    };
    startTransition(async () => {
      const result = await upsertBanner(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <BannerLivePreview
        draft={draft}
        onTextPositionChange={(pos) => setDraft((d) => ({ ...d, ...pos }))}
        onImageFocusChange={(objectPosition) => set("objectPosition", objectPosition)}
      />

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

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
            Largura do texto <span className="text-xs font-normal text-muted-foreground">{draft.maxWidth}%</span>
          </span>
          <input
            type="range"
            min={20}
            max={100}
            value={draft.maxWidth}
            onChange={(e) => set("maxWidth", Number(e.target.value))}
            className="h-11 w-full"
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

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
            Tamanho da fonte <span className="text-xs font-normal text-muted-foreground">{draft.fontSize}px</span>
          </span>
          <input
            type="range"
            min={16}
            max={72}
            value={draft.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
            className="h-11 w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Fonte</span>
          <select
            value={draft.fontFamily}
            onChange={(e) => set("fontFamily", e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {BANNER_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Cor da fonte</span>
          <input
            type="color"
            value={draft.fontColor}
            onChange={(e) => set("fontColor", e.target.value)}
            className="h-11 w-full cursor-pointer rounded-[10px] border border-border bg-card px-1.5"
          />
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
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
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
