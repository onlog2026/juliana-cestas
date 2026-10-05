import type { Metadata } from "next";
import { JsonLdPlataforma } from "@/components/platform/site/seo/json-ld-plataforma";
import { MedicaoPlataforma } from "@/components/platform/site/seo/medicao-plataforma";
import { serializeJsonLd } from "@/modules/seo/schema";
import {
  nomeDaMarca,
  plataformaTemEnderecoConfigurado,
  urlBaseDaPlataformaPorEnv,
} from "@/modules/platform/seo-plataforma";

/**
 * Layout do GRUPO da plataforma (site de vendas, cadastro, planos, modelos e painel /super).
 * Só usa variáveis de ambiente (nada de `headers()`), para não tornar as páginas dinâmicas à toa:
 * a decisão por endereço fica em robots/sitemap/manifest/llms. Canonical é de cada página.
 */
export const revalidate = 300;

const DESCRICAO =
  "Crie sua loja virtual de cestas e presentes: modelos prontos, entrega por data e CEP, pagamento por PIX, cartão e boleto, tudo no mesmo painel.";

export async function generateMetadata(): Promise<Metadata> {
  const marca = await nomeDaMarca();
  const base = urlBaseDaPlataformaPorEnv();
  // Sem endereço de plataforma configurado (preview/local) ou em deploy de preview da Vercel: não indexar.
  const preview = process.env.VERCEL_ENV === "preview" || !plataformaTemEnderecoConfigurado();
  const titulo = `${marca} — loja virtual para cestas e presentes`;
  return {
    metadataBase: new URL(base),
    title: { default: titulo, template: `%s | ${marca}` },
    description: DESCRICAO,
    applicationName: marca,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: marca,
      title: titulo,
      description: DESCRICAO,
      url: "/",
    },
    twitter: { card: "summary_large_image", title: titulo, description: DESCRICAO },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const marca = await nomeDaMarca();
  const base = urlBaseDaPlataformaPorEnv();
  const json = serializeJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: marca,
      url: base,
      logo: `${base}/plataforma-arquivos/icone/512`,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: marca,
      url: base,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description: DESCRICAO,
    },
  ]);

  return (
    <>
      {children}
      <JsonLdPlataforma json={json} />
      <MedicaoPlataforma ga4Id={process.env.PLATFORM_GA4_ID?.trim() || null} gtmId={process.env.PLATFORM_GTM_ID?.trim() || null} />
    </>
  );
}
