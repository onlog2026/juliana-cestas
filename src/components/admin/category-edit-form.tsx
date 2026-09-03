"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertCategory, type CategoryInput } from "@/modules/catalog/category-actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { Category } from "@/modules/catalog/categories";

type Draft = {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
};

function toDraft(category?: Category): Draft {
  return {
    slug: category?.slug ?? "",
    name: category?.name ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? "",
    active: category?.active ?? true,
  };
}

export function CategoryEditForm({
  category,
  onSaved,
  onCancel,
}: {
  category?: Category;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(category));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CategoryInput = {
      id: category?.id,
      slug: category?.slug ?? draft.slug,
      name: draft.name,
      description: draft.description,
      imageUrl: draft.imageUrl,
      active: draft.active,
    };
    startTransition(async () => {
      const result = await upsertCategory(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Nome</span>
        <input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Descrição (opcional)</span>
        <textarea
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <ImageUploadField label="Imagem da categoria (opcional)" value={draft.imageUrl} onChange={(url) => set("imageUrl", url)} />

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-4 rounded border-border"
        />
        Ativa (aparece no site)
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
