"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, RefreshCcw } from "lucide-react";
import { submitDeliveryExperience } from "@/modules/reviews/experience-actions";

const MAX_TEXT = 280;
const MAX_MB = 3.5;

/**
 * "Conte como foi a entrega" (conta do cliente). No celular o botão abre a CÂMERA
 * (`capture="environment"`); no computador, a escolha de arquivo. Texto curto e uma
 * autorização obrigatória: sem ela o botão Enviar não libera.
 */
export function DeliveryExperienceForm({
  orderId,
  storeName,
  whatsapp,
  alreadySent,
}: {
  orderId: string;
  storeName: string;
  /** Só dígitos; usado no link "pedir para remover". */
  whatsapp: string;
  alreadySent: { photoUrl: string; status: "pendente" | "aprovada" | "recusada" } | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const name = storeName || "a loja";
  const canSend = Boolean(file) && consent && !pending;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setError(`Essa foto é grande demais (máximo ${MAX_MB} MB). Tente outra.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    const data = new FormData();
    data.set("orderId", orderId);
    data.set("photo", file);
    data.set("text", text);
    if (consent) data.set("consent", "on");
    startTransition(async () => {
      const result = await submitDeliveryExperience(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setEditing(false);
      router.refresh();
    });
  }

  const removeLink = whatsapp
    ? `https://wa.me/55${whatsapp.replace(/^55/, "")}?text=${encodeURIComponent("Olá! Quero pedir para remover minha foto do site.")}`
    : null;

  if ((alreadySent || done) && !editing) {
    const status = done ? "pendente" : alreadySent?.status;
    return (
      <section className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Check aria-hidden="true" className="size-4 text-primary" /> Obrigado por compartilhar!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "aprovada"
            ? `Sua foto já está no site de ${name}. Foi um prazer fazer parte desse momento.`
            : status === "recusada"
              ? `Recebemos sua foto, mas ela não vai aparecer no site. Obrigado do mesmo jeito!`
              : `Recebemos sua foto. Ela aparece no site depois que ${name} conferir.`}
        </p>
        {alreadySent?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura da própria foto do cliente
          <img src={alreadySent.photoUrl} alt="Sua foto da entrega" className="mt-3 size-24 rounded-[10px] object-cover" />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            <RefreshCcw className="size-4" /> Enviar outra foto
          </button>
          {removeLink ? (
            <a
              href={removeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center px-3 text-sm text-muted-foreground underline"
            >
              Quero remover minha foto
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-card border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Camera aria-hidden="true" className="size-4 text-primary" /> Conte como foi a entrega
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tire uma foto da sua cesta e escreva uma frase. É rápido e ajuda outras pessoas a escolher.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pick}
          className="sr-only"
          aria-label="Tirar ou escolher a foto"
        />

        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob) da foto escolhida */}
            <img src={preview} alt="Prévia da sua foto" className="size-28 rounded-[10px] object-cover" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
            >
              <RefreshCcw className="size-4" /> Trocar foto
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="jc-btn-outline inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold text-primary"
          >
            <Camera className="size-5" /> Tirar foto
          </button>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Sua frase (opcional)</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
            rows={3}
            placeholder="Ex.: Chegou lindo e no horário. Ela amou!"
            className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {text.length}/{MAX_TEXT}
          </span>
        </label>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border border-border p-3 text-sm text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0"
          />
          <span>
            Autorizo {name} a mostrar minha foto e este texto no site.
            <span className="mt-1 block text-xs text-muted-foreground">
              Meu nome aparece só com o primeiro nome e a inicial. Não envie fotos de pessoas sem o consentimento
              delas. Posso pedir a remoção quando quiser.
            </span>
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSend}
          className="jc-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : null}
          Enviar minha foto
        </button>
      </form>
    </section>
  );
}
