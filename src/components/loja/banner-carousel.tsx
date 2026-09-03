"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Check, X, Loader2, Move } from "lucide-react";
import { bannerFontCssVar, BANNER_FONTS } from "@/lib/fonts";
import { upsertBanner } from "@/modules/banners/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Banner } from "@/modules/banners/service";

function isStaffRole(role: unknown): boolean {
  return role === "admin" || role === "staff";
}

type EditDraft = {
  top: number;
  left: number;
  maxWidth: number;
  objectPosition: string;
  textAlign: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontColor: string;
};

function toDraft(banner: Banner): EditDraft {
  return {
    top: banner.textPosition.top,
    left: banner.textPosition.left,
    maxWidth: banner.textPosition.maxWidth,
    objectPosition: banner.objectPosition ?? "50% 50%",
    textAlign: banner.textAlign,
    fontSize: banner.fontSize,
    fontFamily: banner.fontFamily,
    fontColor: banner.fontColor,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * O tamanho da fonte usa clamp(min, 4cqi, max) -- "cqi" é relativo à largura
 * do PRÓPRIO banner (container query), não da janela toda como "vw" fazia.
 * Antes, o preview do admin (numa coluna estreita) e a home (tela toda, e
 * retrato no celular) calculavam esse "4%" contra larguras muito diferentes
 * -- por isso o tamanho configurado nunca batia com o que aparecia de verdade.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const count = banners.length;

  const goPrev = () => setIndex((current) => (current - 1 + count) % count);
  const goNext = () => setIndex((current) => (current + 1) % count);

  useEffect(() => {
    if (count < 2 || paused || editing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5500);
    return () => window.clearInterval(id);
  }, [count, paused, editing]);

  // Checagem só decide se mostra o botão "Editar" -- roda no navegador (chave
  // pública, sem custo de servidor) pra não tirar a home da geração estática.
  // A trava de segurança de verdade é no servidor: upsertBanner() já exige
  // requireStaff() antes de gravar qualquer coisa, então mesmo que esse
  // estado fique errado por algum motivo, nada é salvo sem sessão de staff.
  useEffect(() => {
    let active = true;
    createBrowserSupabaseClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (active) setIsStaff(isStaffRole(session?.user?.app_metadata?.role));
      });
    return () => {
      active = false;
    };
  }, []);

  if (count === 0) return null;

  const current = banners[index];

  function startEditing() {
    setDraft(toDraft(current));
    setEditing(true);
    setPaused(true);
    setError(null);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft(null);
    setError(null);
    setPaused(false);
  }

  function set<K extends keyof EditDraft>(key: K, value: EditDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function positionFromEvent(e: { clientX: number; clientY: number }) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      xPct: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      yPct: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function handleTextPointerDown(e: React.PointerEvent) {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleTextPointerMove(e: React.PointerEvent) {
    if (!editing || !dragging) return;
    const pos = positionFromEvent(e);
    if (!pos) return;
    setDraft((d) => (d ? { ...d, top: Math.round(pos.yPct), left: Math.round(pos.xPct) } : d));
  }

  function handleTextPointerUp(e: React.PointerEvent) {
    if (!editing) return;
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function handleImageClick(e: React.MouseEvent) {
    if (!editing) return;
    e.preventDefault();
    const pos = positionFromEvent(e);
    if (!pos) return;
    set("objectPosition", `${Math.round(pos.xPct)}% ${Math.round(pos.yPct)}%`);
  }

  function handleSave() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertBanner({
        id: current.id,
        slug: current.slug,
        image: current.image,
        href: current.href,
        text: current.text,
        top: draft.top,
        left: draft.left,
        maxWidth: draft.maxWidth,
        objectPosition: draft.objectPosition,
        textAlign: draft.textAlign,
        fontSize: draft.fontSize,
        fontFamily: draft.fontFamily,
        fontColor: draft.fontColor,
        active: current.active,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setDraft(null);
      setPaused(false);
      router.refresh();
    });
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-secondary/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!editing) setPaused(false);
      }}
    >
      <div
        ref={containerRef}
        className="relative aspect-[4/5] w-full [container-type:inline-size] sm:aspect-[16/9] lg:aspect-[21/8]"
      >
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner, i) => {
            const isCurrent = i === index;
            const isEditingThis = isCurrent && editing && draft;
            const effective = isEditingThis
              ? draft
              : {
                  top: banner.textPosition.top,
                  left: banner.textPosition.left,
                  maxWidth: banner.textPosition.maxWidth,
                  objectPosition: banner.objectPosition ?? "50% 50%",
                  textAlign: banner.textAlign ?? "left",
                  fontSize: banner.fontSize,
                  fontFamily: banner.fontFamily,
                  fontColor: banner.fontColor,
                };

            return (
              <Link
                key={banner.id}
                href={banner.href}
                className="relative h-full w-full shrink-0"
                tabIndex={isCurrent ? 0 : -1}
                aria-hidden={isCurrent ? undefined : true}
                onClick={(e) => {
                  if (isEditingThis) e.preventDefault();
                }}
              >
                <Image
                  src={banner.image}
                  alt={banner.text}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={isEditingThis ? "cursor-crosshair object-cover" : "object-cover"}
                  style={{ objectPosition: effective.objectPosition }}
                  onClick={isCurrent ? handleImageClick : undefined}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <p
                  onPointerDown={isCurrent ? handleTextPointerDown : undefined}
                  onPointerMove={isCurrent ? handleTextPointerMove : undefined}
                  onPointerUp={isCurrent ? handleTextPointerUp : undefined}
                  className={`jc-pop absolute flex items-start gap-1.5 leading-snug [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] ${
                    isEditingThis ? "cursor-move select-none" : ""
                  } ${dragging && isEditingThis ? "opacity-80" : ""}`}
                  style={{
                    top: `${effective.top}%`,
                    left: `${effective.left}%`,
                    maxWidth: `${effective.maxWidth}%`,
                    textAlign: effective.textAlign,
                    fontFamily: bannerFontCssVar(effective.fontFamily),
                    color: effective.fontColor,
                    fontSize: `clamp(${Math.round(effective.fontSize * 0.55)}px, 4cqi, ${effective.fontSize}px)`,
                  }}
                >
                  {isEditingThis ? <Move className="mt-1.5 size-4 shrink-0 opacity-70" /> : null}
                  {banner.text}
                </p>
              </Link>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={editing}
              aria-label="Banner anterior"
              className="absolute left-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 disabled:pointer-events-none disabled:opacity-0 sm:left-4"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={editing}
              aria-label="Próximo banner"
              className="absolute right-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 disabled:pointer-events-none disabled:opacity-0 sm:right-4"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}

        {isStaff && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="absolute right-3 top-3 z-10 flex h-10 items-center gap-1.5 rounded-full bg-black/45 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/65"
          >
            <Pencil className="size-4" /> Editar banner
          </button>
        ) : null}

        {count > 1 && !editing ? (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver banner ${i + 1} de ${count}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {editing && draft ? (
        <div className="mx-auto max-w-3xl space-y-4 border-t border-border bg-card p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Arraste o texto pra reposicionar. Clique na foto pra escolher o que fica em destaque.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
                Tamanho da fonte <span className="text-xs font-normal text-muted-foreground">{draft.fontSize}px</span>
              </span>
              <input
                type="range"
                min={16}
                max={72}
                value={draft.fontSize}
                onChange={(e) => set("fontSize", Number(e.target.value))}
                className="h-11 w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Fonte</span>
              <select
                value={draft.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {BANNER_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Cor da fonte</span>
              <input
                type="color"
                value={draft.fontColor}
                onChange={(e) => set("fontColor", e.target.value)}
                className="h-11 w-full cursor-pointer rounded-[10px] border border-border bg-background px-1.5"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
                Largura do texto <span className="text-xs font-normal text-muted-foreground">{draft.maxWidth}%</span>
              </span>
              <input
                type="range"
                min={20}
                max={100}
                value={draft.maxWidth}
                onChange={(e) => set("maxWidth", Number(e.target.value))}
                className="h-11 w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Alinhamento do texto</span>
              <select
                value={draft.textAlign}
                onChange={(e) => set("textAlign", e.target.value as EditDraft["textAlign"])}
                className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </label>
          </div>

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
    </section>
  );
}
