// Dados estruturados (schema.org) — ajudam o Google a mostrar rich snippets
// e são a forma que assistentes de IA (ChatGPT, Perplexity, Gemini) têm de
// entender "o que é esse site" sem precisar adivinhar pelo texto solto.
//
// Nada aqui é da marca de ninguém: nome, telefone e endereço vêm do perfil da
// loja (store_profile) e o resto do bloco de negócio vem do CMS
// (site_content -> seção "business"), sempre por tenant.

import { getTenantId } from "@/lib/tenant/context";
import { getContent } from "@/modules/content/service";
import { getSeoSettings } from "@/modules/seo/service";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getStoreProfile, type StoreProfile } from "@/modules/settings/store-profile";
import { getReviewsSummary } from "@/modules/reviews/service";
import { getSiteSettings } from "@/modules/settings/site-settings";
import {
  breadcrumbSchema,
  formatCnpj,
  itemListSchema,
  productSchema,
  serializeJsonLd,
  websiteSchema,
} from "@/modules/seo/schema";

// TODO F7: a URL pública de cada loja vai vir de `tenant_domains`. Enquanto
// esse mapa não existe, a única fonte é o env da loja legada.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Nome da loja: o do perfil; se ainda não foi preenchido, o título de SEO. */
async function resolveStoreName(tenantId: string): Promise<string> {
  const [profile, seo] = await Promise.all([getStoreProfile(tenantId), getSeoSettings(tenantId)]);
  return clean(profile.businessName) || seo.siteTitle;
}

/** "Rua X, 123" a partir do perfil — só a linha do logradouro. */
function streetFromProfile(profile: StoreProfile): string {
  return [clean(profile.street), clean(profile.addressNumber)].filter(Boolean).join(", ");
}

export async function LocalBusinessJsonLd() {
  const tenantId = await getTenantId();
  const [profile, business, seo, socialLinks, site] = await Promise.all([
    getStoreProfile(tenantId),
    getContent(tenantId, "business"),
    getSeoSettings(tenantId),
    getSocialLinks(tenantId),
    getSiteSettings(tenantId),
  ]);
  // sameAs liga a entidade às redes sociais -- ajuda o Google (e IAs) a
  // confirmar "é essa loja". Só entram os links realmente preenchidos.
  const sameAs = Object.values(socialLinks).filter((v): v is string => Boolean(v && v.trim()));

  const name = clean(profile.businessName) || seo.siteTitle;
  const description = clean(business.description) || seo.siteDescription;
  const telephone = clean(profile.phone);
  const priceRange = clean(business.priceRange);
  const streetAddress = clean(business.streetAddress) || streetFromProfile(profile);
  const addressLocality = clean(business.addressLocality) || clean(profile.city);
  const addressRegion = clean(business.addressRegion) || clean(profile.state);
  const areaServed = clean(business.areaServed) || addressLocality;

  const address =
    streetAddress || addressLocality || addressRegion
      ? {
          "@type": "PostalAddress",
          streetAddress: streetAddress || undefined,
          addressLocality: addressLocality || undefined,
          addressRegion: addressRegion || undefined,
          addressCountry: "BR",
        }
      : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    description,
    url: SITE_URL,
    "@id": `${SITE_URL}/#loja`,
    logo: site.logoHeaderUrl || undefined,
    image: site.logoHeaderUrl || undefined,
    email: clean(profile.email) || undefined,
    // CNPJ só se o documento tem 14 dígitos (CPF nunca é publicado).
    taxID: formatCnpj(profile.document) ?? undefined,
    telephone: telephone || undefined,
    priceRange: priceRange || undefined,
    address,
    areaServed: areaServed ? { "@type": "City", name: areaServed } : undefined,
    openingHoursSpecification:
      business.openDays.length > 0
        ? [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: business.openDays,
              opens: business.opensAt,
              closes: business.closesAt,
            },
          ]
        : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return <JsonLd data={data} />;
}

/** Um bloco JSON-LD já limpo (sem campos vazios) e seguro contra `</script>` no texto. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ trail }: { trail: Array<{ name: string; path: string }> }) {
  return <JsonLd data={breadcrumbSchema(SITE_URL, trail)} />;
}

export function WebSiteJsonLd({ name }: { name: string }) {
  return <JsonLd data={websiteSchema({ siteUrl: SITE_URL, name })} />;
}

export function ItemListJsonLd({ items }: { items: Array<{ name: string; slug: string }> }) {
  return <JsonLd data={itemListSchema(SITE_URL, items)} />;
}

export async function ProductJsonLd({
  name,
  description,
  priceCents,
  images,
  slug,
  brandName,
}: {
  name: string;
  description?: string | null;
  priceCents: number;
  /** Fotos da cesta (capa primeiro). Endereço do Storage vai como está. */
  images: string[];
  slug: string;
  /**
   * Nome da marca (a loja). Se quem chama já tem o nome em mãos, passa aqui e
   * evita uma consulta; se não passar, o componente resolve pela loja da
   * requisição.
   */
  brandName?: string;
}) {
  const tenantId = await getTenantId();
  const [resolvedBrand, rating] = await Promise.all([
    Promise.resolve(clean(brandName)).then((b) => b || resolveStoreName(tenantId)),
    // Nota média da LOJA (avaliações aprovadas de verdade); sem nenhuma, o campo nem entra.
    getReviewsSummary(tenantId).catch(() => ({ average: 0, total: 0 })),
  ]);

  return (
    <JsonLd
      data={productSchema({
        siteUrl: SITE_URL,
        slug,
        name,
        description,
        images,
        priceCents,
        brandName: resolvedBrand,
        rating,
      })}
    />
  );
}
