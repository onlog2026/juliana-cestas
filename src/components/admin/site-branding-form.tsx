"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateSiteSettings } from "@/modules/settings/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { SiteSettings } from "@/modules/settings/site-settings";

export function SiteBrandingForm({ settings }: { settings: SiteSettings }) {
  const [logoHeaderUrl, setLogoHeaderUrl] = useState(settings.logoHeaderUrl ?? "");
  const [logoFooterUrl, setLogoFooterUrl] = useState(settings.logoFooterUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteSettings({ logoHeaderUrl, logoFooterUrl, faviconUrl });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Aceita PNG e GIF animado. Sem enviar nada, o site usa a logo e o ícone padrão.
      </p>

      <ImageUploadField
        label="Logo do topo (header)"
        value={logoHeaderUrl}
        onChange={setLogoHeaderUrl}
        kind="logo"
        accept="image/png,image/gif,image/svg+xml,image/webp"
      />
      <ImageUploadField
        label="Logo do rodapé (footer)"
        value={logoFooterUrl}
        onChange={setLogoFooterUrl}
        kind="logo"
        accept="image/png,image/gif,image/svg+xml,image/webp"
      />
      <ImageUploadField
        label="Favicon (ícone da aba do navegador)"
        value={faviconUrl}
        onChange={setFaviconUrl}
        kind="logo"
        accept="image/png,image/x-icon,image/svg+xml"
      />

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
