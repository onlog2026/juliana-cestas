/**
 * Blocos de história: cartãozinho, seleção especial, texto, depoimentos,
 * galeria e "como funciona".
 *
 * Bloco sem conteúdo NÃO renderiza faixa vazia — devolve `null`. Uma seção
 * "Depoimentos" com zero depoimentos é pior que não ter a seção: a loja parece
 * abandonada.
 */
import Image from "next/image";
import { Star } from "lucide-react";
import { CartaozinhoSection } from "@/components/loja/cartaozinho-section";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";
import { Collections } from "@/components/loja/collections";
import { Reveal } from "@/components/loja/reveal";
import { getContent } from "@/modules/content/service";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { iconByName, SECTION_SHELL, type BlockRenderArgs } from "@/storefront/blocks/kit";
import type {
  CollectionSpotlightProps,
  GalleryProps,
  RichTextProps,
  SignatureProps,
  StepsProps,
  TestimonialsProps,
} from "@/storefront/blocks/schemas";

/* ───────────────────────────── cartãozinho ─────────────────────────────── */

export type SignatureData = { title: string; body: string; imageUrl: string; storeName: string };

export async function loadSignature(
  tenantId: string,
  props: SignatureProps
): Promise<SignatureData> {
  const [content, profile] = await Promise.all([
    getContent(tenantId, "signature"),
    getStoreProfile(tenantId),
  ]);
  return {
    title: content.title,
    body: content.body,
    imageUrl: props.imageOverride || content.imageUrl,
    storeName: profile.businessName?.trim() || "",
  };
}

export function SignatureBlock({ variant, data }: BlockRenderArgs<SignatureProps, SignatureData>) {
  if (variant === "split") {
    return (
      <Reveal className={`${SECTION_SHELL} py-10`}>
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {data.imageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              <Image
                src={data.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <CartaozinhoSignature title={data.title} body={data.body} storeName={data.storeName} />
        </div>
      </Reveal>
    );
  }

  // "image-text" — exatamente as linhas 36-38 da home de hoje.
  return (
    <Reveal>
      <CartaozinhoSection />
    </Reveal>
  );
}

/* ────────────────────────── seleção especial ───────────────────────────── */

export function CollectionSpotlightBlock(_args: BlockRenderArgs<CollectionSpotlightProps>) {
  void _args;
  return <Collections />;
}

/* ──────────────────────────────── texto ────────────────────────────────── */

export function RichTextBlock({ props, variant }: BlockRenderArgs<RichTextProps>) {
  const centralizado = props.align === "center";
  const manifesto = variant === "manifesto";

  return (
    <Reveal className={`${SECTION_SHELL} py-10 sm:py-14`}>
      <div
        className={
          manifesto
            ? centralizado
              ? "mx-auto max-w-3xl text-center"
              : "max-w-3xl"
            : centralizado
              ? "mx-auto max-w-prose text-center"
              : "max-w-prose"
        }
      >
        {props.eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            {props.eyebrow}
          </p>
        ) : null}
        {props.title ? (
          <h2
            className={
              manifesto
                ? "mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl"
                : "mt-3 font-display text-2xl text-foreground"
            }
          >
            {props.title}
          </h2>
        ) : null}
        {props.body ? (
          <p
            className={
              manifesto
                ? "mt-4 whitespace-pre-line text-lg leading-relaxed text-foreground/80"
                : "mt-3 whitespace-pre-line text-base leading-relaxed text-muted-foreground"
            }
          >
            {props.body}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}

/* ───────────────────────────── depoimentos ─────────────────────────────── */

function Estrelas({ nota }: { nota: number }) {
  if (nota <= 0) return null;
  return (
    <p className="flex gap-0.5" aria-label={`Nota ${nota} de 5`}>
      {Array.from({ length: nota }, (_, i) => (
        <Star key={i} className="size-4 fill-[var(--jc-gold)] text-[var(--jc-gold)]" aria-hidden="true" />
      ))}
    </p>
  );
}

export function TestimonialsBlock({ props, variant }: BlockRenderArgs<TestimonialsProps>) {
  if (props.items.length === 0) return null;

  if (variant === "quote") {
    const primeiro = props.items[0];
    return (
      <Reveal className={`${SECTION_SHELL} py-12`}>
        <figure className="mx-auto max-w-3xl text-center">
          <Estrelas nota={primeiro.rating} />
          <blockquote className="mt-3 font-display text-2xl leading-snug text-foreground sm:text-3xl">
            {primeiro.text}
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            {primeiro.name}
            {primeiro.city ? ` — ${primeiro.city}` : ""}
          </figcaption>
        </figure>
      </Reveal>
    );
  }

  return (
    <Reveal className={`${SECTION_SHELL} py-10`}>
      {props.title ? <h2 className="font-display text-2xl text-foreground">{props.title}</h2> : null}
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item) => (
          <li
            key={`${item.name}-${item.text.slice(0, 24)}`}
            className="rounded-card border border-border bg-card p-5"
          >
            <Estrelas nota={item.rating} />
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.text}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {item.name}
              {item.city ? ` — ${item.city}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* ─────────────────────────────── galeria ───────────────────────────────── */

export function GalleryBlock({ props, variant }: BlockRenderArgs<GalleryProps>) {
  const itens = props.items.filter((i) => i.imageUrl);
  if (itens.length === 0) return null;

  if (variant === "logos") {
    return (
      <Reveal className={`${SECTION_SHELL} py-10`}>
        {props.title ? (
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {props.title}
          </h2>
        ) : null}
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
          {itens.map((item) => (
            <li key={item.imageUrl} className="relative h-10 w-28">
              <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                sizes="112px"
                className="object-contain opacity-70 transition-opacity hover:opacity-100"
              />
            </li>
          ))}
        </ul>
      </Reveal>
    );
  }

  if (variant === "strip") {
    return (
      <Reveal className="py-10">
        {props.title ? (
          <h2 className={`${SECTION_SHELL} font-display text-2xl text-foreground`}>{props.title}</h2>
        ) : null}
        <ul className={`${SECTION_SHELL} mt-5 flex snap-x gap-4 overflow-x-auto pb-2`}>
          {itens.map((item) => (
            <li key={item.imageUrl} className="w-56 shrink-0 snap-start">
              <div className="relative aspect-[4/5] overflow-hidden rounded-card">
                <Image src={item.imageUrl} alt={item.alt} fill sizes="224px" className="object-cover" />
              </div>
              {item.caption ? (
                <p className="mt-2 text-xs text-muted-foreground">{item.caption}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Reveal>
    );
  }

  // "masonry" — alturas diferentes, encaixadas. `columns` do CSS resolve sem
  // JavaScript e sem quebrar a rolagem no celular.
  return (
    <Reveal className={`${SECTION_SHELL} py-10`}>
      {props.title ? <h2 className="font-display text-2xl text-foreground">{props.title}</h2> : null}
      <div className="mt-5 columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
        {itens.map((item, indice) => (
          <figure key={item.imageUrl} className="break-inside-avoid">
            <div
              className={`relative overflow-hidden rounded-card ${
                indice % 3 === 0 ? "aspect-[3/4]" : "aspect-square"
              }`}
            >
              <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 30vw, 45vw"
                className="object-cover"
              />
            </div>
            {item.caption ? (
              <figcaption className="mt-2 text-xs text-muted-foreground">{item.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </Reveal>
  );
}

/* ────────────────────────────── como funciona ──────────────────────────── */

export function StepsBlock({ props, variant }: BlockRenderArgs<StepsProps>) {
  if (props.items.length === 0) return null;

  if (variant === "timeline") {
    return (
      <Reveal className={`${SECTION_SHELL} py-10`}>
        <h2 className="font-display text-2xl text-foreground">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
        ) : null}
        <ol className="mt-6 border-l border-border pl-6">
          {props.items.map((item) => {
            const Icone = iconByName(item.icon);
            return (
              <li key={item.title} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[calc(1.5rem+0.75rem)] flex size-6 items-center justify-center rounded-full bg-accent text-primary">
                  <Icone className="size-3.5" />
                </span>
                <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Reveal>
    );
  }

  return (
    <Reveal className={`${SECTION_SHELL} py-10`}>
      <h2 className="font-display text-2xl text-foreground">{props.title}</h2>
      {props.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p> : null}
      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {props.items.map((item, indice) => {
          const Icone = iconByName(item.icon);
          return (
            <li key={item.title} className="rounded-card border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <Icone className="size-5" />
                </span>
                <span className="font-display text-xl text-muted-foreground">{indice + 1}</span>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-foreground">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}
