/**
 * Blocos de apoio: benefícios, perguntas, chamada do WhatsApp, faixa de aviso
 * e "receber novidades".
 */
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Benefits } from "@/components/loja/benefits";
import { Faq } from "@/components/loja/faq";
import { Reveal } from "@/components/loja/reveal";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { getContent } from "@/modules/content/service";
import { iconByName, SECTION_SHELL, type BlockRenderArgs } from "@/storefront/blocks/kit";
import type {
  BenefitsProps,
  CtaWhatsappProps,
  FaqProps,
  NewsletterProps,
  PromoBarProps,
} from "@/storefront/blocks/schemas";

// Mesma fonte que `src/components/loja/whatsapp-cta.tsx` usa hoje.
// TODO F2 (herdado): o telefone vai passar a vir de `tenants.whatsapp`.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

/* ──────────────────────────── benefícios ───────────────────────────────── */

export type BenefitsData = {
  items: { title: string; description: string; icon: string }[];
};

export async function loadBenefits(tenantId: string): Promise<BenefitsData> {
  const content = await getContent(tenantId, "benefits");
  return { items: content.items };
}

export function BenefitsBlock({ variant, data }: BlockRenderArgs<BenefitsProps, BenefitsData>) {
  if (variant === "compact") {
    if (data.items.length === 0) return null;
    return (
      <div className="border-y border-border bg-secondary/40">
        <ul className={`${SECTION_SHELL} flex flex-wrap justify-center gap-x-8 gap-y-3 py-4`}>
          {data.items.map((item) => {
            const Icone = iconByName(item.icon);
            return (
              <li key={item.title} className="flex items-center gap-2">
                <Icone className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // "icons-row" — a faixa de hoje.
  return <Benefits />;
}

/* ─────────────────────────────── perguntas ─────────────────────────────── */

export function FaqBlock(_args: BlockRenderArgs<FaqProps>) {
  void _args;
  return <Faq />;
}

/* ────────────────────────── chamada do WhatsApp ────────────────────────── */

export function CtaWhatsappBlock(_args: BlockRenderArgs<CtaWhatsappProps>) {
  void _args;
  // Exatamente as linhas 42-44 da home de hoje.
  return (
    <Reveal>
      <WhatsappCta />
    </Reveal>
  );
}

/* ───────────────────────────── faixa de aviso ──────────────────────────── */

const TONS: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  gold: "bg-[var(--jc-gold)] text-[#1f2a24]",
  dark: "bg-foreground text-background",
};

export function PromoBarBlock({ props, variant }: BlockRenderArgs<PromoBarProps>) {
  if (!props.text) return null;
  const tom = TONS[props.tone] ?? TONS.primary;

  if (variant === "badges") {
    const partes = props.text
      .split("·")
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <div className="border-b border-border bg-secondary/50">
        <ul className={`${SECTION_SHELL} flex flex-wrap justify-center gap-2 py-3`}>
          {partes.map((parte) => (
            <li
              key={parte}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
            >
              {parte}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={tom}>
      <div className={`${SECTION_SHELL} flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center`}>
        <p className="text-sm font-medium">{props.text}</p>
        {props.linkHref && props.linkLabel ? (
          <Link href={props.linkHref} className="text-sm font-semibold underline underline-offset-4">
            {props.linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ────────────────────────── receber novidades ──────────────────────────── */

/**
 * Sem número de WhatsApp cadastrado, este bloco NÃO aparece.
 *
 * Botão que não leva a lugar nenhum é pior que botão nenhum: o cliente clica,
 * não acontece nada, e ele conclui que a loja está quebrada. Ver também o
 * comentário do `newsletterBlock` em `schemas.ts` sobre por que aqui não tem
 * campo de e-mail.
 */
export function NewsletterBlock({ props, variant }: BlockRenderArgs<NewsletterProps>) {
  if (!WHATSAPP || !props.title) return null;

  const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    "Oi! Quero ser avisado das novidades da loja."
  )}`;

  const botao = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-6 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
    >
      <MessageCircle className="size-5" />
      {props.buttonLabel}
    </a>
  );

  if (variant === "boxed") {
    return (
      <Reveal className={`${SECTION_SHELL} py-10`}>
        <div className="rounded-card border border-border bg-card p-6 text-center sm:p-8">
          <p className="font-display text-2xl text-foreground">{props.title}</p>
          {props.body ? <p className="mt-2 text-sm text-muted-foreground">{props.body}</p> : null}
          <div className="mt-5 flex justify-center">{botao}</div>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="border-t border-border bg-secondary/40">
      <div
        className={`${SECTION_SHELL} flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:justify-between sm:text-left`}
      >
        <div>
          <p className="text-[15px] font-semibold text-foreground">{props.title}</p>
          {props.body ? <p className="mt-0.5 text-sm text-muted-foreground">{props.body}</p> : null}
        </div>
        {botao}
      </div>
    </div>
  );
}
