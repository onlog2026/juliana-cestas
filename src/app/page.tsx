import { Hero } from "@/components/loja/hero";
import { CategoryTiles } from "@/components/loja/category-tiles";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";
import { Collections } from "@/components/loja/collections";
import { Benefits } from "@/components/loja/benefits";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <FeaturedProducts />
      <CartaozinhoSignature />
      <Collections />
      <Benefits />
      <Faq />
      <WhatsappCta />
    </>
  );
}
