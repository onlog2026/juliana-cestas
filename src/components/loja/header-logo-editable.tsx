"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { checkStaffSession } from "@/lib/auth/actions";
import { updateSiteSettings } from "@/modules/settings/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";

/**
 * A logo do cabeçalho, com edição direta na home -- mesmo padrão de
 * "Editar banner" (`banner-carousel.tsx`): `checkStaffSession()` só decide
 * se mostra o lápis, a trava de verdade continua nas actions
 * (`updateSiteSettings` exige o módulo `cms`; `uploadMedia` exige staff).
 *
 * `updateSiteSettings` grava os TRÊS campos de marca juntos (não é um PATCH
 * parcial) -- por isso `logoFooterUrl`/`faviconUrl` chegam como props e
 * voltam inalterados no salvar, mesmo esta tela só mexendo na logo do topo.
 */
export function HeaderLogo({
  logoHeaderUrl,
  logoFooterUrl,
  faviconUrl,
  storeName,
}: {
  logoHeaderUrl: string | null;
  logoFooterUrl: string | null;
  faviconUrl: string | null;
  storeName: string;
}) {
  const router = useRouter();
  const [isStaff, setIsStaff] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftLogo, setDraftLogo] = useState(logoHeaderUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Roda depois que a página carrega -- não tira a home da geração estática.
  useEffect(() => {
    let active = true;
    checkStaffSession().then((staff) => {
      if (active) setIsStaff(staff);
    });
    return () => {
      active = false;
    };
  }, []);

  function startEditing() {
    setDraftLogo(logoHeaderUrl ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraftLogo(logoHeaderUrl ?? "");
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateSiteSettings({
        logoHeaderUrl: draftLogo,
        logoFooterUrl: logoFooterUrl ?? "",
        faviconUrl: faviconUrl ?? "",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-2xl text-primary"
        onClick={(e) => {
          if (editing) e.preventDefault();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pode ser GIF animado; next/image reprocessaria e perderia a animação */}
        <img
          src={logoHeaderUrl || "/logo/juliana-present-icon.svg"}
          alt=""
          aria-hidden="true"
          className="h-20 w-auto max-w-[260px] shrink-0 object-contain"
        />
        {storeName}
      </Link>

      {isStaff && !editing ? (
        <button
          type="button"
          onClick={startEditing}
          aria-label="Editar logo do cabeçalho"
          title="Editar logo"
          className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}

      {editing ? (
        <div className="jc-pop absolute left-0 top-full z-[60] mt-2 w-80 max-w-[90vw] space-y-3 rounded-card border border-border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium text-foreground">Editar logo do cabeçalho</p>
          <ImageUploadField
            label="Logo do topo"
            value={draftLogo}
            onChange={setDraftLogo}
            kind="logo"
            accept="image/png,image/gif,image/svg+xml,image/webp"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={pending}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <X className="size-4" /> Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
