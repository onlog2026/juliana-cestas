import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllProducts } from "@/modules/catalog/service";
import { ProductCard } from "@/components/loja/product-card";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cestas de café da manhã em Brasília | Juliana Cestas",
  description:
    "As 5 cestas de café da manhã da Juliana Cestas: Enquanto, Afeto, Essência, Aconchego e Memorável. Feitas à mão, com cartão de mensagem personalizado.",
};

export default async function CategoriaCafeDaManhaPage() {
  const featuredProducts = await getAllProducts();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Cestas de café da manhã</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Cestas de café da manhã
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        As 5 cestas da Juliana Cestas, montadas à mão em Brasília. Cada uma
        acompanha cartão de mensagem personalizado, do jeitinho que a pessoa
        que vai receber merece.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {featuredProducts.map((product) => (
          <Reveal key={product.id}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>

      <div className="mt-16">
        <Faq />
      </div>
      <WhatsappCta />
    </div>
  );
}
