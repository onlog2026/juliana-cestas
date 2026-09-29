"use client";

import { useState } from "react";
import { Monitor, RefreshCw, Smartphone } from "lucide-react";

type Mode = "mobile" | "desktop";

/**
 * Prévia da loja dentro do painel: a mesma página que o cliente vê, em uma
 * moldura de celular (390px) ou de computador. É a página PUBLICADA -- a home
 * se renova sozinha a cada 30 minutos, então uma mudança recém-salva pode
 * levar um pouco para aparecer aqui (o botão de recarregar busca de novo).
 */
export function StorefrontPreview() {
  const [mode, setMode] = useState<Mode>("mobile");
  const [reload, setReload] = useState(0);

  const tab = (m: Mode, label: string, Icon: typeof Smartphone) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
        mode === m
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tab("mobile", "Celular", Smartphone)}
        {tab("desktop", "Computador", Monitor)}
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          <RefreshCw className="size-4" /> Recarregar
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm font-medium text-primary hover:underline"
        >
          Abrir a loja em outra aba
        </a>
      </div>

      <div className="mt-4 overflow-x-auto rounded-card bg-secondary/60 p-3">
        <div
          className="mx-auto overflow-hidden rounded-[20px] border border-border bg-background shadow-sm"
          style={{ width: mode === "mobile" ? 390 : "100%", maxWidth: "100%" }}
        >
          <iframe
            key={`${mode}-${reload}`}
            src="/"
            title={mode === "mobile" ? "Prévia da loja no celular" : "Prévia da loja no computador"}
            loading="lazy"
            className="block w-full bg-background"
            style={{ height: mode === "mobile" ? 720 : 640, border: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
