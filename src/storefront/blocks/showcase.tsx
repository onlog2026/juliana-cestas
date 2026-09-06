/**
 * Blocos da vitrine: topo, categorias e grade de produtos.
 *
 * As variações que já existem no site da Juliana (`carousel`, `tiles`,
 * `featured`) NÃO foram reescritas: elas chamam os mesmos componentes de
 * hoje, com as mesmas props. É de propósito — o modelo "clássica" tem que
 * produzir o mesmo HTML que a home de hoje produz, e a única forma de garantir
 * isso é reaproveitar o componente, não copiar o JSX dele.
 *
 * As variações novas (`split`, `pills`, `asymmetric`, `dense`) são componentes
 * novos, usados só pelos modelos novos.
 */
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { BannerCarousel } from "@/components/loja/banner-carousel";
import { CategoryTiles } from "@/components/loja/category-tiles";
import { FeaturedProducts } from "@/components/loja/featured-products";
import { ProductCard } from "@/components/loja/product-card";
import { Reveal } from "@/components/loja/reveal";
import { getActiveCategories, type Category } from "@/modules/catalog/categories";
import type { Product } from "@/modules/catalog/product";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveBanners, type Banner } from "@/modules/banners/service";
import { getContent } from "@/modules/content/service";
import { SECTION_SHELL, type BlockRenderArgs } from "@/storefront/blocks/kit";
import type {
  CategoryGridProps,
  HeroProps,
  ProductGridProps,
} from "@/storefront/blocks/schemas";

/* ─────────────────────────────── hero ──────────────────────────────────── */

export type HeroData = { banners: Banner[] };

export async function loadHero(tenantId: string): Promise<HeroData> {
  return { banners: await getActiveBanners(tenantId) };
}

/**
 * Os dois botões logo abaixo do topo.
 *
 * As classes são as mesmas, caractere por caractere, das linhas 20-33 de
 * `src/app/(store)/page.tsx`. Se alguém mudar uma delas aqui, a home deixa de
 * ser idêntica quando a chave for ligada.
 */
function QuickLinks({ links }: { links: HeroProps["quickLinks"] }) {
  if (links.length === 0) return null;
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pt-6 sm:px-6 lg:px-8">
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className={
            link.style === "solid"
              ? "inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
              : "inline-flex h-12 items-center rounded-full border border-[color-mix(in_oklch,var(--primary),transparent_70%)] px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/** Moldura neutra para quando ainda não há foto. Nunca imagem quebrada. */
function FotoVazia({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-secondary text-muted-foreground ${className}`}
      aria-hidden="true"
    >
      <ImageOff className="size-8" />
    </div>
  );
}

export function HeroBlock({ props, variant, data }: BlockRenderArgs<HeroProps, HeroData>) {
  if (variant === "split") {
    return (
      <Reveal className={`${SECTION_SHELL} py-8 sm:py-12`}>
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card sm:aspect-[3/2] lg:aspect-[4/5]">
            {props.imageUrl ? (
              <Image
                src={props.imageUrl}
                alt={props.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover"
              />
            ) : (
              <FotoVazia className="absolute inset-0" />
            )}
          </div>

          <div>
            {props.eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                {props.eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {props.headline}
            </h1>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              {props.body}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {props.quickLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={
                    link.style === "solid"
                      ? "inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
                      : "inline-flex h-12 items-center rounded-full border border-[color-mix(in_oklch,var(--primary),transparent_70%)] px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    );
  }

  // "carousel" — o topo de hoje, sem uma vírgula de diferença.
  return (
    <>
      <BannerCarousel banners={data.banners} />
      <QuickLinks links={props.quickLinks} />
    </>
  );
}

/* ──────────────────────────── categorias ───────────────────────────────── */

export type CategoryGridData = { categories: Category[]; title: string };

export async function loadCategoryGrid(
  tenantId: string,
  props: CategoryGridProps
): Promise<CategoryGridData> {
  const [categories, content] = await Promise.all([
    getActiveCategories(tenantId),
    getContent(tenantId, "category_tiles"),
  ]);
  return { categories, title: props.titleOverride || content.title };
}

export async function CategoryGridBlock({
  props,
  variant,
  data,
}: BlockRenderArgs<CategoryGridProps, CategoryGridData>) {
  if (variant === "pills") {
    if (data.categories.length === 0) return null;
    return (
      // `sticky` com fundo SÓLIDO. Nada de `filter: blur()` aqui: blur em
      // elemento preso na tela trava a rolagem no celular — regra da casa,
      // aprendida quebrando produção.
      <nav
        aria-label="Categorias"
        className={
          props.sticky
            ? "sticky top-0 z-30 border-b border-border bg-background"
            : "border-b border-border bg-background"
        }
      >
        <div className={`${SECTION_SHELL} py-3`}>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {data.categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <Link
                  href={`/categoria/${category.slug}`}
                  className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    );
  }

  // "tiles" — os quadradinhos de hoje. O componente cuida do próprio texto.
  return <CategoryTiles />;
}

/* ────────────────────────── grade de produtos ──────────────────────────── */

export type ProductGridData = { products: Product[]; categories: Category[] };

export async function loadProductGrid(
  tenantId: string,
  props: ProductGridProps
): Promise<ProductGridData> {
  const [todos, categories] = await Promise.all([
    getAllProducts(tenantId),
    props.showFilters ? getActiveCategories(tenantId) : Promise.resolve([] as Category[]),
  ]);
  const products = props.limit > 0 ? todos.slice(0, props.limit) : todos;
  return { products, categories };
}

export async function ProductGridBlock({
  props,
  variant,
  data,
}: BlockRenderArgs<ProductGridProps, ProductGridData>) {
  if (variant === "asymmetric") {
    const [destaque, ...resto] = data.products;
    if (!destaque) return null;
    return (
      <section id="destaques" className={`${SECTION_SHELL} py-10`}>
        <h2 className="font-display text-2xl text-foreground">{props.title}</h2>
        {props.subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
        ) : null}

        <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal className="sm:col-span-2 sm:row-span-2">
            <ProductCard product={destaque} />
          </Reveal>
          {resto.map((product) => (
            <Reveal key={product.id}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "dense") {
    return (
      <section id="catalogo" className={`${SECTION_SHELL} py-8`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl text-foreground">{props.title}</h2>
          <p className="text-sm text-muted-foreground">
            {data.products.length}{" "}
            {data.products.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
        {props.subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
        ) : null}

        {/* Filtro de verdade: cada pílula é um link para a página da categoria.
            Não é filtro de mentira em JavaScript -- funciona sem script, dá
            para compartilhar o link e o Google indexa. */}
        {props.showFilters && data.categories.length > 0 ? (
          <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {data.categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <Link
                  href={`/categoria/${category.slug}`}
                  className="inline-flex h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    );
  }

  // "featured" — a grade "Mais pedidas" de hoje, com o componente de hoje.
  return <FeaturedProducts />;
}
