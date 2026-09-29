"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { updateContent } from "@/modules/content/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProductRibbon } from "@/components/loja/product-ribbon";
import {
  DEFAULT_FLAGS,
  hasLowContrast,
  readableTextOn,
  slugifyFlagId,
  type FlagDef,
  type FlagsConfig,
} from "@/modules/flags/logic";

const textInput =
  "h-11 rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Cor: seletor + campo #rrggbb (o campo aceita colar um código). */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          aria-label={label}
          className="size-11 shrink-0 cursor-pointer rounded-[10px] border border-border bg-background p-1"
        />
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setDraft(value)}
          maxLength={7}
          spellCheck={false}
          className={`${textInput} font-mono uppercase`}
          style={{ width: 104 }}
        />
      </span>
    </label>
  );
}

/** Mostra a tarja como ela fica na foto (mesmo componente da vitrine). */
function Preview({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className="relative block size-24 shrink-0 overflow-hidden rounded-[12px] bg-secondary">
      <ProductRibbon label={label || "Nome"} bg={bg} text={text} size={88} />
    </span>
  );
}

function FlagCard({
  title,
  label,
  bg,
  text,
  enabled,
  onLabel,
  onBg,
  onText,
  onEnabled,
  onRemove,
  labelLocked,
}: {
  title?: string;
  label: string;
  bg: string;
  text: string;
  enabled: boolean;
  onLabel?: (v: string) => void;
  onBg: (v: string) => void;
  onText: (v: string) => void;
  onEnabled: (v: boolean) => void;
  onRemove?: () => void;
  labelLocked?: boolean;
}) {
  const low = hasLowContrast(bg, text);
  return (
    <div className={`rounded-card border border-border bg-card p-4 ${enabled ? "" : "opacity-70"}`}>
      <div className="flex gap-4">
        <Preview label={label} bg={bg} text={text} />
        <div className="min-w-0 flex-1 space-y-3">
          {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
          {labelLocked ? null : (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Texto da tarja</span>
              <input
                value={label}
                onChange={(e) => onLabel?.(e.target.value.slice(0, 24))}
                maxLength={24}
                className={textInput}
                style={{ width: "100%" }}
              />
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <ColorField label="Cor da tarja" value={bg} onChange={onBg} />
            <ColorField label="Cor do texto" value={text} onChange={onText} />
          </div>
          {low ? (
            <p className="flex items-start gap-1.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Texto difícil de ler nesta combinação.{" "}
              <button type="button" className="font-semibold underline" onClick={() => onText(readableTextOn(bg))}>
                Ajustar automático
              </button>
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} className="size-4" />
          {enabled ? "Ligada" : "Desligada"}
        </label>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" /> Remover
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Tela "Flags e tarjas": nomes, cores e liga/desliga de cada flag, mais a flag
 * automática de desconto ("-14%"). O dono escolhe, em cada produto, UMA flag.
 */
export function FlagsEditor({ value }: { value: FlagsConfig }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<FlagDef[]>(value.items);
  const [discount, setDiscount] = useState(value.discount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const touch = () => setSaved(false);
  const patch = (id: string, change: Partial<FlagDef>) => {
    setItems((list) => list.map((f) => (f.id === id ? { ...f, ...change } : f)));
    touch();
  };

  function add() {
    if (items.length >= 20) return;
    const label = "Nova flag";
    setItems((list) => [
      ...list,
      { id: slugifyFlagId(label, list.map((f) => f.id)), label, bg: "#556b2f", text: "#ffffff", enabled: true },
    ]);
    touch();
  }

  async function remove(flag: FlagDef) {
    const r = await confirm({
      title: `Remover a flag "${flag.label}"?`,
      description: "Cestas que usam esta flag ficam sem tarja (o desconto automático continua, se houver preço de/por).",
      tone: "danger",
      confirmLabel: "Remover",
    });
    if (!r.ok) return;
    setItems((list) => list.filter((f) => f.id !== flag.id));
    touch();
  }

  async function restore() {
    const r = await confirm({
      title: "Voltar aos modelos prontos?",
      description: "Nomes e cores voltam ao padrão (Promoção, Black Friday, Dia das Mães, Novo, Últimas unidades).",
      confirmLabel: "Voltar ao padrão",
    });
    if (!r.ok) return;
    setItems(DEFAULT_FLAGS.items);
    setDiscount(DEFAULT_FLAGS.discount);
    touch();
  }

  function save() {
    setError(null);
    setSaved(false);
    if (items.some((f) => !f.label.trim())) {
      setError("Toda flag precisa de um texto.");
      return;
    }
    startTransition(async () => {
      const result = await updateContent("flags", {
        items: items.map((f) => ({ ...f, label: f.label.trim() })),
        discount,
      });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg text-foreground">Desconto automático</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando uma cesta tem preço &quot;de&quot; maior que o atual (ex.: de R$ 300 por R$ 259), a tarja mostra o
          desconto sozinha: <strong>-14%</strong>.
        </p>
        <div className="mt-3 max-w-xl">
          <FlagCard
            label="-14%"
            labelLocked
            bg={discount.bg}
            text={discount.text}
            enabled={discount.enabled}
            onBg={(v) => {
              setDiscount((d) => ({ ...d, bg: v }));
              touch();
            }}
            onText={(v) => {
              setDiscount((d) => ({ ...d, text: v }));
              touch();
            }}
            onEnabled={(v) => {
              setDiscount((d) => ({ ...d, enabled: v }));
              touch();
            }}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-foreground">Flags de campanha</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Em cada cesta (Produtos → abrir a cesta → Promoção e flag) você escolhe UMA. A tarja aparece na
              ponta da foto, na diagonal.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={items.length >= 20}
            className="flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <Plus className="size-4" /> Nova flag
          </button>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {items.map((flag) => (
            <FlagCard
              key={flag.id}
              label={flag.label}
              bg={flag.bg}
              text={flag.text}
              enabled={flag.enabled}
              onLabel={(v) => patch(flag.id, { label: v })}
              onBg={(v) => patch(flag.id, { bg: v })}
              onText={(v) => patch(flag.id, { text: v })}
              onEnabled={(v) => patch(flag.id, { enabled: v })}
              onRemove={() => remove(flag)}
            />
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Salvo" : "Salvar flags"}
        </button>
        <button
          type="button"
          onClick={restore}
          className="flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <RotateCcw className="size-4" /> Voltar aos modelos
        </button>
      </div>
    </div>
  );
}
