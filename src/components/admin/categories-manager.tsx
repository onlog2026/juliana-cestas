"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2, CornerDownRight } from "lucide-react";
import { deleteCategory, reorderCategories } from "@/modules/catalog/category-actions";
import { CategoryEditForm } from "@/components/admin/category-edit-form";
import type { Category } from "@/modules/catalog/categories";

export function CategoriesManager({ categories: initialCategories }: { categories: Category[] }) {
  const router = useRouter();
  // `ordered` guarda a lista PLANA em ordem de exibição: cada categoria
  // principal seguida das suas subcategorias. É a fonte da ordem que vai pro
  // banco (sort_order = posição nesta lista).
  const [ordered, setOrdered] = useState<Category[]>(() => displayOrder(initialCategories));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingChildOf, setCreatingChildOf] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Depois de salvar, o servidor manda a lista nova; re-sincroniza o estado.
  useEffect(() => {
    setOrdered(displayOrder(initialCategories));
  }, [initialCategories]);

  const tops = useMemo(() => ordered.filter((c) => !c.parentId), [ordered]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of ordered) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [ordered]);

  function persist(nextTops: Category[]) {
    const flat = nextTops.flatMap((t) => [t, ...(childrenOf.get(t.id) ?? [])]);
    setOrdered(flat);
    startTransition(() => {
      reorderCategories(flat.map((c) => c.id));
    });
  }

  function persistChildren(parentId: string, nextChildren: Category[]) {
    const flat = tops.flatMap((t) => [t, ...(t.id === parentId ? nextChildren : childrenOf.get(t.id) ?? [])]);
    setOrdered(flat);
    startTransition(() => {
      reorderCategories(flat.map((c) => c.id));
    });
  }

  function moveTop(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= tops.length) return;
    const next = [...tops];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function moveChild(parentId: string, index: number, dir: -1 | 1) {
    const list = [...(childrenOf.get(parentId) ?? [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    persistChildren(parentId, list);
  }

  function handleSaved() {
    setEditingId(null);
    setCreating(false);
    setCreatingChildOf(null);
    router.refresh();
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
      setOrdered((current) => current.filter((c) => c.id !== id));
    });
  }

  // Pais possíveis para o formulário: as principais, menos a que está sendo
  // editada (uma categoria não pode ser pai de si mesma).
  function parentsFor(categoryId?: string): Category[] {
    return tops.filter((t) => t.id !== categoryId);
  }

  function Row({
    category,
    index,
    siblingCount,
    onMove,
    isChild,
  }: {
    category: Category;
    index: number;
    siblingCount: number;
    onMove: (index: number, dir: -1 | 1) => void;
    isChild?: boolean;
  }) {
    if (editingId === category.id) {
      return (
        <CategoryEditForm
          category={category}
          parents={parentsFor(category.id)}
          onSaved={handleSaved}
          onCancel={() => setEditingId(null)}
        />
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3">
        {isChild ? <CornerDownRight className="size-4 shrink-0 text-muted-foreground" /> : null}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
          {category.imageUrl ? (
            <Image src={category.imageUrl} alt="" fill sizes="48px" className="object-cover" />
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
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || pending}
            aria-label="Mover para cima"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === siblingCount - 1 || pending}
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
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {tops.map((top, topIndex) => {
        const children = childrenOf.get(top.id) ?? [];
        return (
          <div key={top.id} className="space-y-2">
            <Row
              category={top}
              index={topIndex}
              siblingCount={tops.length}
              onMove={moveTop}
            />

            {children.length > 0 || creatingChildOf === top.id ? (
              <div className="ml-4 space-y-2 border-l-2 border-border pl-3">
                {children.map((child, childIndex) => (
                  <Row
                    key={child.id}
                    category={child}
                    index={childIndex}
                    siblingCount={children.length}
                    onMove={(i, dir) => moveChild(top.id, i, dir)}
                    isChild
                  />
                ))}

                {creatingChildOf === top.id ? (
                  <CategoryEditForm
                    parents={parentsFor()}
                    defaultParentId={top.id}
                    onSaved={handleSaved}
                    onCancel={() => setCreatingChildOf(null)}
                  />
                ) : null}
              </div>
            ) : null}

            {creatingChildOf === top.id ? null : (
              <button
                type="button"
                onClick={() => setCreatingChildOf(top.id)}
                className="ml-4 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-3.5" /> Nova subcategoria em “{top.name}”
              </button>
            )}
          </div>
        );
      })}

      {creating ? (
        <CategoryEditForm parents={parentsFor()} onSaved={handleSaved} onCancel={() => setCreating(false)} />
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

/** Lista plana na ordem de exibição: cada principal seguida das suas filhas. */
function displayOrder(categories: Category[]): Category[] {
  const tops = categories.filter((c) => !c.parentId);
  const childrenOf = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parentId) {
      const list = childrenOf.get(c.parentId) ?? [];
      list.push(c);
      childrenOf.set(c.parentId, list);
    }
  }
  return tops.flatMap((t) => [t, ...(childrenOf.get(t.id) ?? [])]);
}
