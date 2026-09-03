"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { deleteCategory, reorderCategories } from "@/modules/catalog/category-actions";
import { CategoryEditForm } from "@/components/admin/category-edit-form";
import type { Category } from "@/modules/catalog/categories";

export function CategoriesManager({ categories: initialCategories }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSaved() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    startTransition(() => {
      reorderCategories(next.map((c) => c.id));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta categoria? Não dá pra desfazer.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCategories((current) => current.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {categories.map((category, index) =>
        editingId === category.id ? (
          <CategoryEditForm
            key={category.id}
            category={category}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
              {category.imageUrl ? (
                <Image src={category.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.active ? "Ativa" : "Inativa"} · /categoria/{category.slug}
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
                disabled={index === categories.length - 1 || pending}
                aria-label="Mover para baixo"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(category.id)}
                aria-label="Editar"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category.id)}
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
        <CategoryEditForm onSaved={handleSaved} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Nova categoria
        </button>
      )}
    </div>
  );
}
