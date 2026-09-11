"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { checkStaffSession } from "@/lib/auth/actions";
import { updateSiteSettings } from "@/modules/settings/actions";
import {
  LOGO_HEADER_HEIGHT_DEFAULT,
  LOGO_HEADER_HEIGHT_MAX,
  LOGO_HEADER_HEIGHT_MIN,
} from "@/modules/settings/logo-constants";
import { ImageUploadField } from "@/components/admin/image-upload-field";

/**
 * A logo do cabeçalho, com edição direta na home -- mesmo padrão de
 * "Editar banner" (`banner-carousel.tsx`): `checkStaffSession()` só decide
 * se mostra o lápis, a trava de verdade continua nas actions
 * (`updateSiteSettings` exige o módulo `cms`; `uploadMedia` exige staff).
 *
 * `updateSiteSettings` grava os campos de marca juntos, mas `logoHeaderHeight`
 * só entra no que é gravado quando ESTA tela manda um valor -- ver o
 * comentário em `settings/actions.ts`. Sem isso, salvar a logo pela tela de
 * marca do admin (que ainda não tem esse controle) apagaria o tamanho de
 * volta pro padrão.
 */
export function HeaderLogo({
  logoHeaderUrl,
  logoFooterUrl,
  faviconUrl,
  logoHeaderHeight,
  storeName,
}: {
  logoHeaderUrl: string | null;
  logoFooterUrl: string | null;
  faviconUrl: string | null;
  logoHeaderHeight: number | null;
  storeName: string;
}) {
  const router = useRouter();
  const [isStaff, setIsStaff] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftLogo, setDraftLogo] = useState(logoHeaderUrl ?? "");
  const [draftHeight, setDraftHeight] = useState(logoHeaderHeight ?? LOGO_HEADER_HEIGHT_DEFAULT);
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

  // Enquanto NÃO está editando, mostra o que está salvo de verdade -- só
  // durante a edição o slider manda no que aparece (pré-visualização ao vivo,
  // igual o "Tamanho da fonte" do editor de banner).
  const alturaExibida = editing ? draftHeight : logoHeaderHeight ?? LOGO_HEADER_HEIGHT_DEFAULT;

  function startEditing() {
    setDraftLogo(logoHeaderUrl ?? "");
    setDraftHeight(logoHeaderHeight ?? LOGO_HEADER_HEIGHT_DEFAULT);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraftLogo(logoHeaderUrl ?? "");
    setDraftHeight(logoHeaderHeight ?? LOGO_HEADER_HEIGHT_DEFAULT);
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateSiteSettings({
        logoHeaderUrl: draftLogo,
        logoFooterUrl: logoFooterUrl ?? "",
        faviconUrl: faviconUrl ?? "",
        logoHeaderHeight: draftHeight,
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
    // `min-w-0` (em vez de `shrink-0`) no bloco todo: a imagem não deve
    // espremer, mas o conjunto logo+nome precisa PODER ceder numa viewport
    // estreita -- senão uma logo larga (até 320px) + nome longo empurram a
    // largura da página no mobile. A <img> mantém `shrink-0`; o nome ganha
    // `truncate`.
    <div className="relative flex min-w-0 items-center">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2.5 font-display text-2xl text-primary"
        onClick={(e) => {
          if (editing) e.preventDefault();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pode ser GIF animado; next/image reprocessaria e perderia a animação */}
        <img
          src={logoHeaderUrl || "/logo/juliana-present-icon.svg"}
          alt=""
          aria-hidden="true"
          style={{ height: `${alturaExibida}px` }}
          className="w-auto max-w-[320px] shrink-0 object-contain"
        />
        {/* O nome em texto só aparece quando NÃO há logo-imagem própria: a
            logo da loja já traz o nome escrito, então repetir "Juliana Cestas"
            ao lado seria redundante. Loja sem logo ainda mostra o nome (ao lado
            do ícone padrão) para não ficar sem identificação. */}
        {storeName && !logoHeaderUrl ? (
          <span className="min-w-0 truncate">{storeName}</span>
        ) : null}
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

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
              Tamanho da logo <span className="text-xs font-normal text-muted-foreground">{draftHeight}px</span>
            </span>
            <input
              type="range"
              min={LOGO_HEADER_HEIGHT_MIN}
              max={LOGO_HEADER_HEIGHT_MAX}
              value={draftHeight}
              onChange={(e) => setDraftHeight(Number(e.target.value))}
              className="h-11 w-full"
            />
          </label>

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
