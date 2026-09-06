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
import { getStoreProfile, type StoreProfile } from "@/modules/settings/store-profile";

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
  const [profile, business, seo] = await Promise.all([
    getStoreProfile(tenantId),
    getContent(tenantId, "business"),
    getSeoSettings(tenantId),
  ]);

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
    sameAs: [] as string[],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function ProductJsonLd({
  name,
  description,
  priceCents,
  imageUrl,
  slug,
  brandName,
}: {
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  slug: string;
  /**
   * Nome da marca (a loja). Se quem chama já tem o nome em mãos, passa aqui e
   * evita uma consulta; se não passar, o componente resolve pela loja da
   * requisição.
   */
  brandName?: string;
}) {
  const resolvedBrand = clean(brandName) || (await resolveStoreName(await getTenantId()));

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: imageUrl ? `${SITE_URL}${imageUrl}` : undefined,
    url: `${SITE_URL}/produto/${slug}`,
    brand: resolvedBrand ? { "@type": "Brand", name: resolvedBrand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/produto/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
