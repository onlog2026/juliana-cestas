import { Hero } from "@/components/loja/hero";
import { CategoryTiles } from "@/components/loja/category-tiles";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";
import { Collections } from "@/components/loja/collections";
import { Benefits } from "@/components/loja/benefits";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";

export default function Home() {
  return (
    <>
      <Hero />
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
