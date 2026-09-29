/**
 * Dados estruturados (schema.org / JSON-LD) — construtores PUROS, sem banco e sem React.
 * Regras:
 *  - nunca inventar: campo sem dado real NÃO entra (`undefined` é removido);
 *  - `AggregateRating` só com avaliações reais aprovadas (total > 0);
 *  - CNPJ só se o documento tem 14 dígitos (CPF nunca é publicado);
 *  - URLs de imagem: se já é absoluta (Storage), fica como está; se é caminho do site, ganha o domínio.
 */

type Json = Record<string, unknown>;

/** Remove chaves `undefined`/nulas/vazias, recursivamente (JSON-LD limpo). */
export function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => prune(v)).filter((v) => v !== undefined && v !== null) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Json = {};
    for (const [k, v] of Object.entries(value as Json)) {
      const cleaned = prune(v);
      if (cleaned === undefined || cleaned === null || cleaned === "") continue;
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      out[k] = cleaned;
    }
    return out as T;
  }
  return value;
}

/**
 * Texto do JSON-LD para dentro do `<script>`: escapa `<` (um nome de produto com
 * `</script>` fecharia a tag e abriria uma brecha de XSS).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(prune(data)).replace(/</g, "\\u003c");
}

export function absoluteUrl(siteUrl: string, pathOrUrl: string | null | undefined): string | undefined {
  const v = (pathOrUrl ?? "").trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `${siteUrl.replace(/\/$/, "")}${v.startsWith("/") ? v : `/${v}`}`;
}

/** "12.345.678/0001-90" a partir de 14 dígitos; qualquer outra coisa (CPF, vazio) = null. */
export function formatCnpj(raw: string | null | undefined): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length !== 14) return null;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function productSchema(input: {
  siteUrl: string;
  slug: string;
  name: string;
  description?: string | null;
  images: string[];
  priceCents: number;
  brandName?: string | null;
  sku?: string | null;
  inStock?: boolean;
  /** Fim da promoção (ISO). Só entra quando informado. */
  priceValidUntil?: string | null;
  rating?: { average: number; total: number } | null;
}): Json {
  const url = `${input.siteUrl}/produto/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.images.map((i) => absoluteUrl(input.siteUrl, i)).filter(Boolean),
    url,
    sku: input.sku ?? undefined,
    brand: input.brandName ? { "@type": "Brand", name: input.brandName } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (input.priceCents / 100).toFixed(2),
      availability: input.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      priceValidUntil: input.priceValidUntil ?? undefined,
    },
    aggregateRating:
      input.rating && input.rating.total > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating.average.toFixed(1),
            reviewCount: input.rating.total,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
  };
}

export function breadcrumbSchema(siteUrl: string, trail: Array<{ name: string; path: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${siteUrl}${t.path}`,
    })),
  };
}

export function websiteSchema(input: { siteUrl: string; name: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.siteUrl,
    inLanguage: "pt-BR",
  };
}

export function itemListSchema(siteUrl: string, items: Array<{ name: string; slug: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${siteUrl}/produto/${p.slug}`,
    })),
  };
}
