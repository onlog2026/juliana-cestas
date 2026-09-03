"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateSocialLinks } from "@/modules/settings/actions";
import type { SocialLinks } from "@/modules/settings/social-links";

const FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/seuusuario" },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/suapagina" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/seuusuario" },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@seucanal" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/suaempresa" },
];

export function SocialLinksForm({ links }: { links: SocialLinks }) {
  const [values, setValues] = useState<Record<keyof SocialLinks, string>>({
    instagram: links.instagram ?? "",
    facebook: links.facebook ?? "",
    x: links.x ?? "",
    youtube: links.youtube ?? "",
    linkedin: links.linkedin ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSocialLinks(values);
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Deixe um campo em branco para o ícone daquela rede não aparecer no site. Preenchendo, o ícone aparece automaticamente no topo do cabeçalho e no rodapé.
      </p>
      {FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</span>
          <input
            value={values[field.key]}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      ))}

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
