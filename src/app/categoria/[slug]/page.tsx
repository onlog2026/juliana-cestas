import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCategoryBySlug } from "@/modules/catalog/categories";
import { getProductsByCategoryId } from "@/modules/catalog/service";
import { ProductCard } from "@/components/loja/product-card";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { Reveal } from "@/components/loja/reveal";

export const revalidate = 300;

export async function generateMetadata(
  props: PageProps<"/categoria/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoriaPage(props: PageProps<"/categoria/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
      ) : null}

      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Reveal key={product.id}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">Nenhuma cesta cadastrada nessa categoria ainda.</p>
      )}

      <div className="mt-16">
        <Faq />
      </div>
      <WhatsappCta />
    </div>
  );
}
