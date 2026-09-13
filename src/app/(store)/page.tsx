import Link from "next/link";
import { BannerCarousel } from "@/components/loja/banner-carousel";
import { getActiveBanners } from "@/modules/banners/service";
import { CategoryTiles } from "@/components/loja/category-tiles";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { CartaozinhoSection } from "@/components/loja/cartaozinho-section";
import { Collections } from "@/components/loja/collections";
import { Benefits } from "@/components/loja/benefits";
import { ReviewsShowcase } from "@/components/loja/reviews/reviews-showcase";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";

export default async function Home() {
  const tenantId = await getTenantId();
  const [banners, profile] = await Promise.all([
    getActiveBanners(tenantId),
    getStoreProfile(tenantId),
  ]);
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
          href="#mais-pedidas"
          className="inline-flex h-12 items-center rounded-full border border-[color-mix(in_oklch,var(--primary),transparent_70%)] px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
        >
          Mais pedidas
        </Link>
      </div>
      <CategoryTiles />
      <FeaturedProducts />
      <Reveal>
        <CartaozinhoSection />
      </Reveal>
      <Collections />
      {/* Prova social entra logo depois das coleções, antes dos benefícios:
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
