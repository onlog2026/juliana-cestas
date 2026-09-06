"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Stars } from "./stars";

export type CarouselReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  reply: string | null;
  productName: string | null;
};

/**
 * Carrossel das avaliações aprovadas.
 *
 * A ORDEM JÁ VEM PRONTA DO SERVIDOR (embaralhada com semente do dia, em
 * `orderForDay`). Aqui NÃO existe `Math.random()`: sorteio no cliente muda a
 * cada render, o HTML do servidor deixa de bater com o do navegador e o React
 * quebra a hidratação em produção — erro que já derrubou tela neste projeto.
 *
 * Rolagem por CSS scroll-snap (nada de biblioteca): no celular a pessoa
 * arrasta com o dedo como está acostumada; no desktop as setas movem um cartão
 * por vez. `overflow-x` fica DENTRO do trilho, então a página nunca ganha
 * rolagem horizontal.
 */
export function ReviewsCarousel({ reviews }: { reviews: CarouselReview[] }) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  useEffect(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;

    const atualizar = () => {
      const folga = trilho.scrollWidth - trilho.clientWidth;
      setPodeVoltar(trilho.scrollLeft > 8);
      setPodeAvancar(folga > 8 && trilho.scrollLeft < folga - 8);
    };

    atualizar();
    trilho.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      trilho.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, [reviews.length]);

  function mover(direcao: -1 | 1) {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const passo = trilho.clientWidth * 0.85;
    trilho.scrollBy({ left: passo * direcao, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trilhoRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex w-[85%] shrink-0 snap-start flex-col rounded-card border border-border bg-card p-5 sm:w-[46%] lg:w-[31%]"
          >
            <div className="flex items-center justify-between gap-2">
              <Stars rating={review.rating} />
              <Quote aria-hidden="true" className="size-5 shrink-0 text-border" />
            </div>

            {review.comment ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {review.comment}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-muted-foreground">
                Avaliou com {review.rating} de 5 estrelas.
              </p>
            )}

            {review.photoUrl ? (
              <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-secondary">
                <Image
                  src={review.photoUrl}
                  alt={`Foto enviada por ${review.customerName}`}
                  fill
                  sizes="(max-width: 640px) 85vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            {review.reply ? (
              <p className="mt-4 rounded-[10px] bg-secondary/60 p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Resposta da loja: </span>
                {review.reply}
              </p>
            ) : null}

            <p className="mt-4 text-sm font-medium text-foreground">{review.customerName}</p>
            {review.productName ? (
              <p className="text-xs text-muted-foreground">{review.productName}</p>
            ) : null}
          </article>
        ))}
      </div>

      {reviews.length > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={!podeVoltar}
            aria-label="Ver avaliações anteriores"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={!podeAvancar}
            aria-label="Ver próximas avaliações"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
