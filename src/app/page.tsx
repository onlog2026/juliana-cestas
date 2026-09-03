import Link from "next/link";
import { BannerCarousel } from "@/components/loja/banner-carousel";
import { getActiveBanners } from "@/modules/banners/service";
import { CategoryTiles } from "@/components/loja/category-tiles";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";
import { Collections } from "@/components/loja/collections";
import { Benefits } from "@/components/loja/benefits";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";

export default async function Home() {
  const banners = await getActiveBanners();

  return (
    <>
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
        <CartaozinhoSignature />
      </Reveal>
      <Collections />
      <Benefits />
      <Faq />
      <Reveal>
        <WhatsappCta />
      </Reveal>
    </>
  );
}
