"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

type Media = { type: "image"; url: string } | { type: "video"; url: string };

/** Troca sozinha a cada 3s. Pausa no hover, no vídeo e com "reduzir animações". */
const AUTOPLAY_MS = 3000;

export function ProductGallery({
  images,
  videoUrl,
  name,
  badge,
  imageAlt,
}: {
  images: string[];
  videoUrl?: string;
  name: string;
  badge?: string;
  /** Texto alternativo escrito pela lojista (ou pela IA). Vazio = usa o nome. */
  imageAlt?: string;
}) {
  const media: Media[] = [
    ...images.map((url): Media => ({ type: "image", url })),
    ...(videoUrl ? [{ type: "video", url: videoUrl } as Media] : []),
  ];
  const count = media.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = media[active] ?? media[0];
  const isVideo = current?.type === "video";

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + count) % count),
    [count]
  );

  // Troca automática. Depende de `active`, então clicar numa seta ou miniatura
  // reinicia a contagem (não pula logo em seguida). Pausa quando: o mouse está
  // em cima (paused), o item atual é vídeo (não cortar o vídeo), ou o sistema
  // pediu "reduzir animações". clearTimeout no cleanup evita timer duplicado.
  useEffect(() => {
    if (count <= 1 || paused || isVideo) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = setTimeout(() => setActive((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [active, paused, isVideo, count]);

  return (
    <div>
      <div
        className="jc-glow-card jc-pop group relative aspect-square overflow-hidden rounded-card bg-secondary"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {current?.type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={current.url} controls className="absolute inset-0 size-full object-cover" />
        ) : current ? (
          <Image src={current.url} alt={imageAlt || name} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
        ) : null}

        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--jc-gold)] px-3 py-1 text-xs font-semibold text-[#1f2a24]">
            {badge}
          </span>
        ) : null}

        {count > 1 ? (
          <>
            {/* Setas: sempre tocáveis no mobile; no desktop aparecem mais no
                hover. Alvo de 44px (regra da casa) e contraste garantido. */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md transition hover:bg-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md transition hover:bg-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Pontinhos: mostram em qual foto está. */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((m, i) => (
                <span
                  key={`dot-${m.type}-${m.url}`}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {media.map((m, i) => (
            <button
              key={`${m.type}-${m.url}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={m.type === "video" ? "Ver vídeo" : `Ver foto ${i + 1}`}
              className={`relative size-16 shrink-0 overflow-hidden rounded-[10px] border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent"
              }`}
            >
              {m.type === "video" ? (
                <>
                  <video src={m.url} className="absolute inset-0 size-full object-cover" muted />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="size-5 fill-white text-white" />
                  </span>
                </>
              ) : (
                <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
