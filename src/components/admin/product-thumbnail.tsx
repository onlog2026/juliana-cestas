"use client";

import { useState } from "react";
import Image from "next/image";

const PREVIEW_SIZE = 220;

export function ProductThumbnail({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [preview, setPreview] = useState<{ left: number; top: number } | null>(null);

  function showPreview(trigger: HTMLElement) {
    if (!imageUrl) return;
    const rect = trigger.getBoundingClientRect();
    const left = Math.min(rect.right + 12, window.innerWidth - PREVIEW_SIZE - 12);
    const top = Math.min(rect.top, window.innerHeight - PREVIEW_SIZE - 12);
    setPreview({ left, top });
  }

  return (
    <div
      className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-secondary"
      onMouseEnter={(e) => showPreview(e.currentTarget)}
      onMouseLeave={() => setPreview(null)}
    >
      {imageUrl ? <Image src={imageUrl} alt={alt} fill sizes="48px" className="object-cover" /> : null}

      {preview && imageUrl ? (
        <div
          style={{
            position: "fixed",
            left: preview.left,
            top: preview.top,
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
          }}
          className="pointer-events-none z-50 overflow-hidden rounded-card border border-border bg-card shadow-lg"
        >
          <Image src={imageUrl} alt={alt} fill sizes={`${PREVIEW_SIZE}px`} className="object-cover" />
        </div>
      ) : null}
    </div>
  );
}
