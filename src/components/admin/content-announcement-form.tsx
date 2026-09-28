"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateContent } from "@/modules/content/actions";
import type { StoreContent } from "@/modules/content/types";
import { AnnouncementBar } from "@/components/loja/announcement-bar";

const DEFAULT_BG = "#556b2f";
const DEFAULT_TEXT = "#fbf6ea";
const TEXT_MAX = 160;

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Editor da barra de aviso do topo da loja. A faixa só existe para avisos:
 * desligada (ou sem texto) some inteira do site. A prévia usa o MESMO
 * componente da loja, então o que aparece aqui é o que o cliente vai ver.
 */
export function ContentAnnouncementForm({ value }: { value: StoreContent["announcement"] }) {
  const [enabled, setEnabled] = useState(value.enabled);
  const [text, setText] = useState(value.text);
  const [href, setHref] = useState(value.href ?? "");
  const [bgColor, setBgColor] = useState(value.bgColor ?? "");
  const [textColor, setTextColor] = useState(value.textColor ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setSaved(false);
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (enabled && !text.trim()) {
      setError("Escreva o texto do aviso (ou desligue a barra).");
      return;
    }
    const payload = {
      enabled,
      text: text.trim(),
      ...(href.trim() ? { href: href.trim() } : {}),
      ...(bgColor ? { bgColor } : {}),
      ...(textColor ? { textColor } : {}),
    };
    startTransition(async () => {
      const result = await updateContent("announcement", payload);
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Mostrar aviso no topo</p>
          <p className="text-xs text-muted-foreground">
            Desligado, a faixa some do site. Use para frete grátis, feriado, promoção.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Mostrar aviso no topo"
          onClick={() => touch(setEnabled)(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
          Texto do aviso
          <span className={`text-xs font-normal ${text.length > TEXT_MAX ? "text-destructive" : "text-muted-foreground"}`}>
            {text.length}/{TEXT_MAX}
          </span>
        </span>
        <input
          value={text}
          onChange={(e) => touch(setText)(e.target.value.slice(0, TEXT_MAX))}
          placeholder="Ex.: Frete grátis em compras acima de R$ 300"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Link (opcional)</span>
        <input
          value={href}
          onChange={(e) => touch(setHref)(e.target.value)}
          placeholder="/categoria/cafe-da-manha  ou  https://…"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Se preencher, o aviso vira clicável. Use um caminho do site (começando com /) ou um link https.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">Cor do fundo</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor || DEFAULT_BG}
              onChange={(e) => touch(setBgColor)(e.target.value)}
              aria-label="Cor do fundo do aviso"
              className="size-11 shrink-0 cursor-pointer rounded-[10px] border border-border bg-background p-1"
            />
            <button
              type="button"
              onClick={() => touch(setBgColor)("")}
              disabled={!bgColor}
              className="text-xs font-medium text-muted-foreground underline disabled:no-underline disabled:opacity-50"
            >
              Usar cor da loja
            </button>
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">Cor do texto</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor || DEFAULT_TEXT}
              onChange={(e) => touch(setTextColor)(e.target.value)}
              aria-label="Cor do texto do aviso"
              className="size-11 shrink-0 cursor-pointer rounded-[10px] border border-border bg-background p-1"
            />
            <button
              type="button"
              onClick={() => touch(setTextColor)("")}
              disabled={!textColor}
              className="text-xs font-medium text-muted-foreground underline disabled:no-underline disabled:opacity-50"
            >
              Usar cor da loja
            </button>
          </div>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">Como fica no site</span>
        <div className="overflow-hidden rounded-[10px] border border-border">
          {text.trim() ? (
            <AnnouncementBar
              announcement={{
                enabled: true,
                text,
                bgColor: bgColor || undefined,
                textColor: textColor || undefined,
              }}
            />
          ) : (
            <p className="px-4 py-3 text-xs text-muted-foreground">Escreva o texto para ver a prévia.</p>
          )}
        </div>
        {!enabled && text.trim() ? (
          <p className="mt-1 text-xs text-muted-foreground">Desligado: esta faixa não aparece no site.</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar aviso"}
      </button>
    </form>
  );
}
