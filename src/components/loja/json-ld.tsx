// Dados estruturados (schema.org) — ajudam o Google a mostrar rich snippets
// e são a forma que assistentes de IA (ChatGPT, Perplexity, Gemini) têm de
// entender "o que é esse site" sem precisar adivinhar pelo texto solto.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Juliana Cestas",
    description:
      "Cestas de café da manhã artesanais em Brasília, com entrega no mesmo dia e cartão de mensagem personalizado.",
    url: SITE_URL,
    telephone: "+5561998894889",
    priceRange: "R$179 - R$489",
    address: {
      "@type": "PostalAddress",
      streetAddress: "QNL 7 Bloco D, Edifício São Raimundo",
      addressLocality: "Brasília",
      addressRegion: "DF",
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "City",
      name: "Brasília",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
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

export function ProductJsonLd({
  name,
  description,
  priceCents,
  imageUrl,
  slug,
}: {
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  slug: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: imageUrl ? `${SITE_URL}${imageUrl}` : undefined,
    url: `${SITE_URL}/produto/${slug}`,
    brand: { "@type": "Brand", name: "Juliana Cestas" },
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
