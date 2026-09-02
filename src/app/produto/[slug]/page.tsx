import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, MessageCircle } from "lucide-react";
import { featuredProducts } from "@/lib/mock-content";
import { ProductCard } from "@/components/loja/product-card";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getProduct(slug: string) {
  return featuredProducts.find((item) => item.slug === slug);
}

export function generateStaticParams() {
  return featuredProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/produto/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return {};

  return {
    title: `${product.name} | Juliana Present`,
    description: `${product.name} — ${product.serves}, ${currency.format(product.price)}. ${product.packaging}`,
  };
}

export default async function ProdutoPage(
  props: PageProps<"/produto/[slug]">
) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const whatsappMessage = encodeURIComponent(
    `Olá! Quero encomendar a ${product.name} (${currency.format(product.price)}).`
  );
  const outrasCestas = featuredProducts.filter((item) => item.id !== product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/categoria/cafe-da-manha" className="transition-colors hover:text-primary">
          Cestas de café da manhã
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-card bg-secondary">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-[var(--jc-gold)] px-3 py-1 text-xs font-semibold text-[#1f2a24]">
              {product.badge}
            </span>
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-3xl text-foreground md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {product.serves} · Tamanho {product.size}
          </p>
          <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">
            {currency.format(product.price)}
          </p>

          <a
            href={`https://wa.me/${WHATSAPP}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-7 text-base font-semibold text-white transition-transform active:scale-[0.98] sm:w-auto"
          >
            <MessageCircle className="size-5" />
            Encomendar pelo WhatsApp
          </a>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">
              O que vem na cesta
            </h2>
            <ul className="mt-3 space-y-2">
              {product.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">
              Embalagem
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.packaging}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
        <CartaozinhoSignature />
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl text-foreground">
          Outras cestas
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {outrasCestas.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
