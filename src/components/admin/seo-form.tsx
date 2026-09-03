"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateSeoSettings } from "@/modules/seo/actions";
import type { SeoSettings } from "@/modules/seo/service";

export function SeoForm({ settings }: { settings: SeoSettings }) {
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [keywords, setKeywords] = useState(settings.keywords.join(", "));
  const [ogImageUrl, setOgImageUrl] = useState(settings.ogImageUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSeoSettings({ siteTitle, siteDescription, keywords, ogImageUrl });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  const keywordCount = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Título do site
        </span>
        <input
          value={siteTitle}
          onChange={(e) => setSiteTitle(e.target.value)}
          maxLength={70}
          className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="mt-1 block text-xs text-muted-foreground">{siteTitle.length}/70 caracteres</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Descrição (aparece no Google embaixo do título)
        </span>
        <textarea
          value={siteDescription}
          onChange={(e) => setSiteDescription(e.target.value)}
          maxLength={160}
          rows={3}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="mt-1 block text-xs text-muted-foreground">{siteDescription.length}/160 caracteres</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Palavras-chave (separadas por vírgula)
        </span>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={5}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="mt-1 block text-xs text-muted-foreground">{keywordCount} palavras-chave</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Imagem de compartilhamento (aparece quando alguém manda o link no WhatsApp)
        </span>
        <input
          value={ogImageUrl}
          onChange={(e) => setOgImageUrl(e.target.value)}
          placeholder="/images/produtos/cesta-romance-ao-amanhecer.webp"
          className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar"}
      </button>
    </form>
  );
}
