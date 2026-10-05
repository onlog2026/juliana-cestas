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
import { fraseH1Home, nomeLojaReserva } from "@/modules/seo/texto-legado";
import { ItemListJsonLd, WebSiteJsonLd } from "@/components/loja/json-ld";
import { TrustBar } from "@/components/loja/trust-bar";
import { RecentlyViewed } from "@/components/loja/recently-viewed";
import { toLiteProducts } from "@/components/loja/lite-product";
import { HOMES } from "@/storefront/temas";
import { getTemaInstalado } from "@/storefront/temas/instalado";
import { dadosLoja } from "@/storefront/temas/dados-loja";

// A home é estática; renova a cada 30 min para as vitrines acompanharem vendas e cliques.
export const revalidate = 1800;

export default async function Home() {
  const tenantId = await getTenantId();
  // Modelo novo instalado: a página inicial é a dele, com os produtos reais da loja.
  const instalado = await getTemaInstalado(tenantId);
  if (instalado) {
    const d = await dadosLoja(tenantId, "", instalado.variacao);
    const HomeTema = HOMES[instalado.tema.key];
    return <HomeTema d={d} />;
  }
  const [banners, profile, products] = await Promise.all([
    getActiveBanners(tenantId),
    getStoreProfile(tenantId),
    getAllProducts(tenantId),
  ]);
  // Vitrines por vendas/cliques: só aparecem com dados suficientes (>= 4 produtos).
  const showcases = await getShowcases(tenantId, products);
  const storeName = profile.businessName?.trim() || nomeLojaReserva(tenantId);

  return (
    <>
      {/* H1 semântico da home. Fica invisível (sr-only) para não competir com
          o banner no visual, mas dá ao Google e a leitores de tela o título
          principal da página -- o analisador acusava "nenhum H1". */}
      <WebSiteJsonLd name={storeName} />
      <ItemListJsonLd items={products.slice(0, 12).map((p) => ({ name: p.name, slug: p.slug }))} />
      <h1 className="sr-only">
        {fraseH1Home(tenantId, storeName)}
      </h1>
      <BannerCarousel banners={banners}>
        <Link
          href="#nossas-cestas"
          className="jc-btn-outline inline-flex h-12 items-center rounded-full px-7 text-base font-semibold text-primary"
        >
          Nossas cestas
        </Link>
      </BannerCarousel>
      <TrustBar />
      {/* Atalhos das categorias reais + UMA grade de produtos. Os blocos
          antigos "CategoryTiles" (lista de produtos com nome de categoria) e
          "Collections" (seleção por preço, conteúdo de semente de quando a
          loja tinha 5 cestas) repetiam os mesmos produtos 3-4 vezes na página
          -- saíram da home (decisão do dono, 28/09). */}
      <CategoryShortcuts />
      <FeaturedProducts />
      <ShowcaseRow title="Mais comprados" products={showcases.bought} />
      <ShowcaseRow title="Mais clicados" products={showcases.clicked} />
      <RecentlyViewed products={toLiteProducts(products)} />
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
