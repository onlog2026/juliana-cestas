"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Move } from "lucide-react";
import { bannerFontCssVar } from "@/lib/fonts";

type Draft = {
  image: string;
  text: string;
  top: number;
  left: number;
  maxWidth: number;
  objectPosition: string;
  textAlign: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontColor: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Preview do banner EXATAMENTE como aparece na home (mesma proporção,
 * mesmo gradiente, mesma tipografia) -- arrastar o texto ou clicar na foto
 * atualiza a posição ao vivo, em vez de digitar números "no escuro".
 */
export function BannerLivePreview({
  draft,
  onTextPositionChange,
  onImageFocusChange,
}: {
  draft: Draft;
  onTextPositionChange: (pos: { top: number; left: number }) => void;
  onImageFocusChange: (objectPosition: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function positionFromEvent(e: { clientX: number; clientY: number }) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      xPct: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      yPct: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function handleTextPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleTextPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const pos = positionFromEvent(e);
    if (!pos) return;
    onTextPositionChange({ top: Math.round(pos.yPct), left: Math.round(pos.xPct) });
  }

  function handleTextPointerUp(e: React.PointerEvent) {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function handleImageClick(e: React.MouseEvent) {
    const pos = positionFromEvent(e);
    if (!pos) return;
    onImageFocusChange(`${Math.round(pos.xPct)}% ${Math.round(pos.yPct)}%`);
  }

  const [focusX, focusY] = draft.objectPosition
    .split(" ")
    .map((v) => Number.parseFloat(v) || 50);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[21/8] w-full select-none overflow-hidden rounded-card border border-border bg-secondary [container-type:inline-size]"
      >
        {draft.image ? (
          <Image
            src={draft.image}
            alt=""
            fill
            sizes="100vw"
            className="cursor-crosshair object-cover"
            style={{ objectPosition: draft.objectPosition }}
            onClick={handleImageClick}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Envie uma imagem para ver o preview
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* marcador do ponto de foco da foto */}
        <div
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ top: `${focusY}%`, left: `${focusX}%` }}
        />

        {draft.text ? (
          <p
            onPointerDown={handleTextPointerDown}
            onPointerMove={handleTextPointerMove}
            onPointerUp={handleTextPointerUp}
            className={`absolute flex cursor-move items-start gap-1.5 leading-snug [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] ${
              dragging ? "opacity-80" : ""
            }`}
            style={{
              top: `${draft.top}%`,
              left: `${draft.left}%`,
              maxWidth: `${draft.maxWidth}%`,
              textAlign: draft.textAlign,
              fontFamily: bannerFontCssVar(draft.fontFamily),
              color: draft.fontColor,
              fontSize: `clamp(${Math.round(draft.fontSize * 0.55)}px, 4cqi, ${draft.fontSize}px)`,
            }}
          >
            <Move className="mt-1.5 size-4 shrink-0 opacity-70" />
            {draft.text}
          </p>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Arraste o texto pra reposicionar. Clique na foto pra escolher o que fica em destaque (o pontinho branco marca onde está agora).
      </p>
    </div>
  );
}
