"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Check, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { updateContent, resetContent } from "@/modules/content/actions";
import type { StoreSection } from "@/modules/content/types";

/**
 * Editor de uma seção que é uma LISTA de itens iguais (benefícios, perguntas
 * frequentes, parágrafos de página). Um formulário só, reaproveitado por
 * várias seções -- acrescentar uma seção nova é passar outra config, não
 * escrever tela nova.
 */

export type FieldDef = {
  key: string;
  label: string;
  /** "text" = uma linha; "textarea" = várias; "select" = lista fechada. */
  type: "text" | "textarea" | "select";
  options?: readonly string[];
  placeholder?: string;
};

type Item = Record<string, string>;

export function ContentListForm({
  section,
  itemsKey,
  items: initialItems,
  fields,
  itemLabel,
  isCustom,
  maxItems = 20,
  help,
  titleLabel,
  title: initialTitle,
}: {
  section: StoreSection;
  /** Nome do campo que guarda a lista dentro do payload (ex.: "items"). */
  itemsKey: string;
  items: Item[];
  fields: FieldDef[];
  itemLabel: string;
  isCustom: boolean;
  maxItems?: number;
  help?: string;
  /**
   * Quando a seção tem um título ALÉM da lista (páginas /sobre, /trocas), ele
   * é editado aqui dentro de propósito: salvar grava a seção inteira, então
   * dois formulários separados para a mesma seção apagariam um ao outro.
   */
  titleLabel?: string;
  title?: string;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Depois de salvar/restaurar, o servidor manda a lista nova por prop --
  // sem isto o formulário continuaria mostrando o que estava antes.
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setTitle(initialTitle ?? "");
  }, [initialTitle]);

  function update(index: number, key: string, value: string) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    setSaved(false);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setSaved(false);
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
    setSaved(false);
  }

  function add() {
    const blank: Item = {};
    for (const f of fields) blank[f.key] = f.type === "select" ? (f.options?.[0] ?? "") : "";
    setItems((current) => [...current, blank]);
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const payload: Record<string, unknown> = { [itemsKey]: items };
      if (titleLabel !== undefined) payload.title = title;
      const result = await updateContent(section, payload);
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  function handleReset() {
    if (!confirm("Voltar esta seção para o texto padrão? O que você escreveu aqui será apagado.")) return;
    setError(null);
    startTransition(async () => {
      const result = await resetContent(section);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}

      {titleLabel !== undefined ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">{titleLabel}</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-[10px] border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {itemLabel} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Mover para cima"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Mover para baixo"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remover"
                  className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-foreground">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={item[field.key] ?? ""}
                      onChange={(e) => update(index, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-[10px] border border-border bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={item[field.key] ?? ""}
                      onChange={(e) => update(index, field.key, e.target.value)}
                      className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={item[field.key] ?? ""}
                      onChange={(e) => update(index, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {items.length < maxItems ? (
        <button
          type="button"
          onClick={add}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Adicionar {itemLabel.toLowerCase()}
        </button>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Salvo" : "Salvar"}
        </button>
        {isCustom ? (
          <button
            type="button"
            onClick={handleReset}
            disabled={pending}
            className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="size-4" /> Voltar ao padrão
          </button>
        ) : null}
      </div>
    </form>
  );
}
