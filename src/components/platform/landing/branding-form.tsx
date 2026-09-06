"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Check, Upload, X, RotateCcw } from "lucide-react";
import {
  updatePlatformContent,
  resetPlatformContent,
  uploadPlatformImage,
} from "@/modules/platform/landing-actions";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * Marca da PLATAFORMA (logo e favicon do produto, não de nenhuma loja).
 *
 * O campo de envio é o mesmo desenho do `ImageUploadField` do painel da loja
 * (botão que dispara um `<input type="file">` escondido -- nunca um `<label>`
 * embrulhando o input, que já deu problema em outro projeto). O que muda é a
 * ação chamada: `uploadMedia` exige `requireStaff()` e grava na pasta da loja;
 * quem administra a plataforma não é staff de loja nenhuma.
 *
 * A URL nunca é digitada à mão: só entra o que voltou do nosso próprio
 * armazenamento. É o que garante que o `next/image` consiga otimizar (o
 * `remotePatterns` do next.config só libera o host do Supabase).
 */

function CampoImagem({
  label,
  ajuda,
  value,
  onChange,
  kind,
  accept,
}: {
  label: string;
  ajuda?: string;
  value: string;
  onChange: (url: string) => void;
  kind: "logo" | "favicon";
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function enviaArquivo(file: File | undefined) {
    if (!file) return;
    setErro(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);
    startTransition(async () => {
      const resultado = await uploadPlatformImage(formData);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      onChange(resultado.url);
    });
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {ajuda ? <p className="mb-2 text-xs text-muted-foreground">{ajuda}</p> : null}

      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-[10px] border border-border bg-secondary">
            <Image src={value} alt="" fill sizes="80px" className="object-contain p-1.5" />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remover ${label.toLowerCase()}`}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-border text-muted-foreground">
            <Upload className="size-5" />
          </div>
        )}

        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => enviaArquivo(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pendente}
            className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
          >
            {pendente ? <Loader2 className="size-4 animate-spin" /> : null}
            {pendente ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {erro ? <p className="mt-1 text-xs text-destructive">{erro}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function PlatformBrandingForm({
  branding,
  isCustom,
}: {
  branding: PlatformContent["branding"];
  isCustom: boolean;
}) {
  const [wordmark, setWordmark] = useState(branding.wordmark);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(branding.faviconUrl);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  // Sem efeito copiando a propriedade para o estado: depois de salvar, o que
  // está na tela já é o que foi gravado. O único caso divergente é o "Voltar ao
  // padrão", e lá a função recarrega a página.

  function envia(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await updatePlatformContent("branding", { wordmark, logoUrl, faviconUrl });
      if (!resultado.ok) setErro(resultado.error);
      else setSalvo(true);
    });
  }

  function restaura() {
    if (!confirm("Voltar a marca da plataforma para o padrão? A logo e o ícone enviados deixam de ser usados."))
      return;
    setErro(null);
    startTransition(async () => {
      const resultado = await resetPlatformContent("branding");
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <form onSubmit={envia} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Nome da plataforma</span>
        <input
          value={wordmark}
          onChange={(e) => {
            setWordmark(e.target.value);
            setSalvo(false);
          }}
          placeholder="Ex: Plataforma"
          className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Aparece no topo da página, no rodapé e no título da aba do navegador. Se você enviar uma logo, ela
          substitui o nome no topo — mas o texto continua sendo lido por quem usa leitor de tela.
        </span>
      </label>

      <CampoImagem
        label="Logo da plataforma"
        ajuda="PNG ou SVG com fundo transparente funcionam melhor. Aparece no topo da página, com 32px de altura."
        value={logoUrl}
        onChange={(url) => {
          setLogoUrl(url);
          setSalvo(false);
        }}
        kind="logo"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
      />

      <CampoImagem
        label="Ícone da aba (favicon)"
        ajuda="Qualquer imagem serve — a gente encaixa automaticamente num quadrado de 256px, sem cortar nada."
        value={faviconUrl}
        onChange={(url) => {
          setFaviconUrl(url);
          setSalvo(false);
        }}
        kind="favicon"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
      />

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : salvo ? <Check className="size-4" /> : null}
          {salvo ? "Salvo" : "Salvar"}
        </button>
        {isCustom ? (
          <button
            type="button"
            onClick={restaura}
            disabled={pendente}
            className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="size-4" /> Voltar ao padrão
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Enviar a imagem já a guarda no servidor, mas ela só passa a aparecer na página depois que você clicar em
        Salvar.
      </p>
    </form>
  );
}
