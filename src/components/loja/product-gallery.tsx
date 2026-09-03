"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

type Media = { type: "image"; url: string } | { type: "video"; url: string };

export function ProductGallery({
  images,
  videoUrl,
  name,
  badge,
}: {
  images: string[];
  videoUrl?: string;
  name: string;
  badge?: string;
}) {
  const media: Media[] = [
    ...images.map((url): Media => ({ type: "image", url })),
    ...(videoUrl ? [{ type: "video", url: videoUrl } as Media] : []),
  ];
  const [active, setActive] = useState(0);
  const current = media[active] ?? media[0];

  return (
    <div>
      <div className="jc-glow-card jc-pop relative aspect-square overflow-hidden rounded-card bg-secondary">
        {current?.type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={current.url} controls className="absolute inset-0 size-full object-cover" />
        ) : current ? (
          <Image src={current.url} alt={name} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
        ) : null}
        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--jc-gold)] px-3 py-1 text-xs font-semibold text-[#1f2a24]">
            {badge}
          </span>
        ) : null}
      </div>

      {media.length > 1 ? (
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
