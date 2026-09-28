import Link from "next/link";
import { BannerCarousel } from "@/components/loja/banner-carousel";
import { getActiveBanners } from "@/modules/banners/service";
import { CategoryShortcuts } from "@/components/loja/category-shortcuts";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { ShowcaseRow } from "@/components/loja/showcase-row";
import { getAllProducts } from "@/modules/catalog/service";
import { getShowcases } from "@/modules/catalog/showcases";
import { CartaozinhoSection } from "@/components/loja/cartaozinho-section";
import { Benefits } from "@/components/loja/benefits";
import { ReviewsShowcase } from "@/components/loja/reviews/reviews-showcase";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";

// A home é estática; renova a cada 30 min para as vitrines acompanharem vendas e cliques.
export const revalidate = 1800;

export default async function Home() {
  const tenantId = await getTenantId();
  const [banners, profile, products] = await Promise.all([
    getActiveBanners(tenantId),
    getStoreProfile(tenantId),
    getAllProducts(tenantId),
  ]);
  // Vitrines por vendas/cliques: só aparecem com dados suficientes (>= 4 produtos).
  const showcases = await getShowcases(tenantId, products);
  const storeName = profile.businessName?.trim() || "Cestas de café da manhã";

  return (
    <>
      {/* H1 semântico da home. Fica invisível (sr-only) para não competir com
          o banner no visual, mas dá ao Google e a leitores de tela o título
          principal da página -- o analisador acusava "nenhum H1". */}
      <h1 className="sr-only">
        {storeName} — cestas de café da manhã, presentes e kits comemorativos feitos à mão
      </h1>
      <BannerCarousel banners={banners} />
      <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/categoria/cafe-da-manha"
          className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
        >
          Ver cestas
        </Link>
        <Link
          href="#nossas-cestas"
          className="inline-flex h-12 items-center rounded-full border border-[color-mix(in_oklch,var(--primary),transparent_70%)] px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
        >
          Nossas cestas
        </Link>
      </div>
      {/* Atalhos das categorias reais + UMA grade de produtos. Os blocos
          antigos "CategoryTiles" (lista de produtos com nome de categoria) e
          "Collections" (seleção por preço, conteúdo de semente de quando a
          loja tinha 5 cestas) repetiam os mesmos produtos 3-4 vezes na página
          -- saíram da home (decisão do dono, 28/09). */}
      <CategoryShortcuts />
      <FeaturedProducts />
      <ShowcaseRow title="Mais comprados" products={showcases.bought} />
      <ShowcaseRow title="Mais clicados" products={showcases.clicked} />
      <Reveal>
        <CartaozinhoSection />
      </Reveal>
      {/* Prova social entra logo depois da grade, antes dos benefícios:
          quem chegou até aqui já viu o produto e é onde a opinião de outra
          pessoa pesa. Sem nenhuma avaliação aprovada, o componente devolve
          `null` e a home fica exatamente como está hoje -- seção vazia é pior
          que seção ausente. */}
      <ReviewsShowcase />
      <Benefits />
      <Faq />
      <Reveal>
        <WhatsappCta />
      </Reveal>
    </>
  );
}
