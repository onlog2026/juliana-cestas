"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Check, RotateCcw } from "lucide-react";
import { updateContent, resetContent } from "@/modules/content/actions";
import type { StoreSection } from "@/modules/content/types";
import type { FieldDef } from "@/components/admin/content-list-form";

/**
 * Editor de uma seção que é um conjunto de campos soltos (chamada do
 * WhatsApp, bloco do cartãozinho, dados do negócio). Mesmo padrão visual do
 * editor de listas -- acrescentar seção é passar outra config.
 */
export function ContentFieldsForm({
  section,
  value,
  fields,
  isCustom,
  help,
}: {
  section: StoreSection;
  value: Record<string, unknown>;
  fields: FieldDef[];
  isCustom: boolean;
  help?: string;
}) {
  const toStrings = (v: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const f of fields) out[f.key] = v[f.key] === undefined || v[f.key] === null ? "" : String(v[f.key]);
    return out;
  };

  const [values, setValues] = useState<Record<string, string>>(toStrings(value));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Depois de salvar/restaurar chega valor novo por prop -- sem isto o
  // formulário continuaria mostrando o texto antigo.
  useEffect(() => {
    setValues(toStrings(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateContent(section, values);
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

      {fields.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</span>
          {field.type === "textarea" ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [field.key]: e.target.value }));
                setSaved(false);
              }}
              placeholder={field.placeholder}
              rows={4}
              className="w-full rounded-[10px] border border-border bg-background px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : field.type === "select" ? (
            <select
              value={values[field.key] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [field.key]: e.target.value }));
                setSaved(false);
              }}
              className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={values[field.key] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [field.key]: e.target.value }));
                setSaved(false);
              }}
              placeholder={field.placeholder}
              className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </label>
      ))}

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
