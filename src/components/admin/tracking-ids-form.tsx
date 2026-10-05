"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateTrackingIds } from "@/modules/settings/actions";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** IDs do Google Analytics 4 e do Tag Manager desta loja (cada loja mede só no seu). */
export function TrackingIdsForm({ ga4Id, gtmId }: { ga4Id: string | null; gtmId: string | null }) {
  const [ga4, setGa4] = useState(ga4Id ?? "");
  const [gtm, setGtm] = useState(gtmId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateTrackingIds({ ga4Id: ga4, gtmId: gtm });
      if (!r.ok) setError(r.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">ID do Google Analytics 4</span>
        <input value={ga4} onChange={(e) => setGa4(e.target.value)} placeholder="G-ABC1234567" maxLength={20} autoCapitalize="characters" className={inputClass} />
        <span className="mt-1 block text-xs text-muted-foreground">
          No Google Analytics: Administrador › Fluxos de dados › sua loja › &ldquo;ID da métrica&rdquo;. Deixe em branco para não medir.
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">ID do Google Tag Manager (opcional)</span>
        <input value={gtm} onChange={(e) => setGtm(e.target.value)} placeholder="GTM-ABC1234" maxLength={20} autoCapitalize="characters" className={inputClass} />
        <span className="mt-1 block text-xs text-muted-foreground">No Tag Manager, o ID aparece no topo da tela, ao lado do nome do contêiner.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar
        </button>
        {saved ? <span className="inline-flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> Salvo</span> : null}
      </div>
    </form>
  );
}
