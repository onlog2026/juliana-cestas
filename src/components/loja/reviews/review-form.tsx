"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Check, Loader2, Star, X } from "lucide-react";
import { submitReview, uploadReviewPhoto } from "@/modules/reviews/actions";

const LEGENDA: Record<number, string> = {
  1: "Não gostei",
  2: "Podia ser melhor",
  3: "Foi ok",
  4: "Gostei",
  5: "Amei!",
};

/**
 * Formulário de avaliação do cliente.
 *
 * `notaInicial` vem do `?nota=N` do e-mail: quem clicou na 4ª estrela do
 * convite chega aqui com 4 já marcado e só precisa confirmar.
 *
 * A nota é revalidada no SERVIDOR (`submitReview`) — o que chega daqui é
 * sempre tratado como palpite do navegador.
 */
export function ReviewForm({
  token,
  notaInicial,
  customerName,
}: {
  token: string;
  notaInicial: number | null;
  customerName: string;
}) {
  const [rating, setRating] = useState<number>(notaInicial ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const mostrada = hover || rating;

  function escolherFoto(file: File | null) {
    if (!file) return;
    setErro(null);
    setEnviandoFoto(true);
    const formData = new FormData();
    formData.append("token", token);
    formData.append("file", file);
    startTransition(async () => {
      const resultado = await uploadReviewPhoto(formData);
      setEnviandoFoto(false);
      if (resultado.ok) setPhotoUrl(resultado.url);
      else setErro(resultado.error);
    });
  }

  function enviar() {
    if (rating < 1) {
      setErro("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await submitReview({ token, rating, comment, photoUrl });
      if (resultado.ok) setEnviada(true);
      else setErro(resultado.error);
    });
  }

  if (enviada) {
    return (
      <div className="rounded-card border border-border bg-card p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary),transparent_85%)]">
          <Check className="size-6 text-primary" />
        </span>
        <h2 className="mt-4 font-display text-2xl text-foreground">Obrigado!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recebemos sua avaliação. A loja vai conferir antes de publicar no site — é assim que a
          gente garante que tudo que aparece por lá é de quem comprou de verdade.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-card p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">
        Oi, {customerName}! Sua opinião leva menos de um minuto.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-foreground">Que nota você dá?</legend>
        <div className="mt-3 flex flex-wrap items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"} — ${LEGENDA[n]}`}
              aria-pressed={rating === n}
              className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={`size-7 ${n <= mostrada ? "text-[var(--jc-gold)]" : "text-border"}`}
                fill={n <= mostrada ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {mostrada > 0 ? LEGENDA[mostrada] : "Toque nas estrelas"}
          </span>
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="comentario" className="text-sm font-medium text-foreground">
          Quer contar mais? <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="comentario"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 800))}
          rows={4}
          placeholder="O que você achou da cesta, da entrega, do atendimento..."
          className="mt-2 w-full rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{comment.length}/800</p>
      </div>

      <div className="mt-4">
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => escolherFoto(e.target.files?.[0] ?? null)}
        />
        {photoUrl ? (
          <div className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Foto que você enviou"
              className="size-14 shrink-0 rounded-[8px] object-cover"
            />
            <span className="flex-1 text-sm text-muted-foreground">Foto anexada</span>
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              aria-label="Remover foto"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            disabled={enviandoFoto || pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
          >
            {enviandoFoto ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {enviandoFoto ? "Enviando foto..." : "Anexar uma foto (opcional)"}
          </button>
        )}
      </div>

      {erro ? (
        <p role="alert" className="mt-4 rounded-[10px] bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <button
        type="button"
        onClick={enviar}
        disabled={pending || enviandoFoto}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
      >
        {pending && !enviandoFoto ? <Loader2 className="size-5 animate-spin" /> : null}
        Enviar avaliação
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        A loja revisa antes de publicar. Seu e-mail nunca aparece no site.
      </p>
    </div>
  );
}
