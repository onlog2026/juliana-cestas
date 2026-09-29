"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateSeoSettings } from "@/modules/seo/actions";
import type { SeoSettings } from "@/modules/seo/service";
import { ImageUploadField } from "@/components/admin/image-upload-field";

/**
 * Imagem que aparece quando alguém manda o link da loja no WhatsApp, Instagram
 * ou Facebook. Mantém título/descrição/palavras-chave como estão (só troca a imagem).
 */
export function OgImageForm({ settings }: { settings: SeoSettings }) {
  const [url, setUrl] = useState(settings.ogImageUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSeoSettings({
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        keywords: settings.keywords.join(", "),
        ogImageUrl: url,
      });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <ImageUploadField
        label="Imagem de compartilhamento"
        value={url}
        onChange={(next) => {
          setUrl(next);
          setSaved(false);
        }}
        kind="logo"
        accept="image/png,image/jpeg"
      />
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Tamanho ideal: 1200×630 pixels (formato retangular, deitado). Use PNG ou JPG.</li>
        <li>Deixe o logo/texto no centro: cada rede corta as bordas de um jeito.</li>
        <li>
          Depois de trocar, o WhatsApp e o Facebook podem levar alguns dias para mostrar a nova imagem (eles guardam a
          antiga).
        </li>
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar imagem"}
      </button>
    </div>
  );
}
