import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Quote } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import {
  countApprovedReviews,
  getApprovedReviews,
  getReviewsSummary,
} from "@/modules/reviews/service";
import { Stars } from "@/components/loja/reviews/stars";

// TODO F7: a URL pública de cada loja virá de `tenant_domains`.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

const POR_PAGINA = 20;

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId();
  const [profile, resumo] = await Promise.all([
    getStoreProfile(tenantId),
    getReviewsSummary(tenantId),
  ]);
  const storeName = profile.businessName?.trim() || "";
  const media = resumo.total > 0 ? `${resumo.average.toFixed(1).replace(".", ",")} de 5` : "";

  return {
    title: "Avaliações de quem comprou",
    description: storeName
      ? `O que os clientes${storeName ? ` da ${storeName}` : ""} dizem${media ? `: nota ${media} em ${resumo.total} avaliações` : ""}.`
      : `Avaliações reais de quem comprou${media ? `: nota ${media}` : ""}.`,
    alternates: { canonical: "/avaliacoes" },
  };
}

/**
 * O LINK UNIVERSAL: `/avaliacoes`.
 *
 * Uma página só, com todas as avaliações aprovadas, paginada. É o endereço que
 * a lojista manda no WhatsApp, coloca na bio do Instagram e no rodapé.
 *
 * Leva dados estruturados (schema.org `AggregateRating` + `Review`) porque é
 * assim que o Google mostra as estrelinhas no resultado de busca — e é assim
 * que ChatGPT/Perplexity entendem a reputação da loja sem adivinhar pelo texto.
 * O bloco só sai quando existe avaliação de verdade: marcar nota sem avaliação
 * é o tipo de coisa que rende penalidade.
 */
export default async function AvaliacoesPage(props: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina } = await props.searchParams;
  const paginaAtual = Math.max(1, Number.parseInt(pagina ?? "1", 10) || 1);
  const offset = (paginaAtual - 1) * POR_PAGINA;

  const tenantId = await getTenantId();
  const [profile, resumo, total, reviews] = await Promise.all([
    getStoreProfile(tenantId),
    getReviewsSummary(tenantId),
    countApprovedReviews(tenantId),
    getApprovedReviews(tenantId, { limit: POR_PAGINA, offset }),
  ]);

  const storeName = profile.businessName?.trim() || "";
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const jsonLd =
    resumo.total > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Store",
          name: storeName || undefined,
          url: `${SITE_URL}/avaliacoes`,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: resumo.average.toFixed(1),
            reviewCount: resumo.total,
            bestRating: "5",
            worstRating: "1",
          },
          review: reviews.slice(0, 10).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.customerName },
            datePublished: r.submittedAt ? r.submittedAt.slice(0, 10) : undefined,
            reviewBody: r.comment || undefined,
            reviewRating: {
              "@type": "Rating",
              ratingValue: String(r.rating),
              bestRating: "5",
              worstRating: "1",
            },
          })),
        }
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Avaliações</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Avaliações de quem comprou
      </h1>

      {resumo.total > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-border bg-card px-4 py-3">
          <Stars rating={resumo.average} size="md" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{resumo.average.toFixed(1).replace(".", ",")}</strong>{" "}
            de 5 · {resumo.total} {resumo.total === 1 ? "avaliação" : "avaliações"}
            {storeName ? ` de clientes da ${storeName}` : ""}
          </p>
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Ainda não há avaliações publicadas. Assim que os primeiros pedidos forem entregues e
          avaliados, elas aparecem aqui.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col rounded-card border border-border bg-card p-5"
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
                    sizes="(max-width: 640px) 90vw, 45vw"
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
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 ? (
        <nav aria-label="Paginação" className="mt-8 flex items-center justify-between gap-3">
          {paginaAtual > 1 ? (
            <Link
              href={paginaAtual - 1 === 1 ? "/avaliacoes" : `/avaliacoes?pagina=${paginaAtual - 1}`}
              className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Página {paginaAtual} de {totalPaginas}
          </span>
          {paginaAtual < totalPaginas ? (
            <Link
              href={`/avaliacoes?pagina=${paginaAtual + 1}`}
              className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Próximas
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
