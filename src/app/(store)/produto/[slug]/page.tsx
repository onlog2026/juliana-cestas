import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Gift, MessageCircle, Package, PackageOpen } from "lucide-react";
import { getAllProducts, getProductBySlug } from "@/modules/catalog/service";
import { ProductCard } from "@/components/loja/product-card";
import { ProductGallery } from "@/components/loja/product-gallery";
import { CartaozinhoSection } from "@/components/loja/cartaozinho-section";
import { AddToCartButton } from "@/components/loja/add-to-cart-button";
import { Reveal } from "@/components/loja/reveal";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/loja/json-ld";
import { ItemIcon } from "@/components/loja/item-icon";
import { TrackViewItem } from "@/components/analytics/track-events";
import { splitListText } from "@/modules/catalog/list-text";
import { clampTitle, pickDescription } from "@/modules/seo/meta";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { descricaoProdutoReserva, ehLojaOriginal, entregaNeutra } from "@/modules/seo/texto-legado";
import { getCategoryById } from "@/modules/catalog/categories";
import { getTemaInstalado } from "@/storefront/temas/instalado";
import { dadosLoja } from "@/storefront/temas/dados-loja";
import { ProdutoAoVivo } from "@/storefront/temas/ao-vivo";
import { CARTOES } from "@/storefront/temas/internas";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { getDeliverySettings } from "@/modules/delivery/settings";
import { getAlsoBought } from "@/modules/catalog/also-bought";
import { DeliveryToday } from "@/components/loja/delivery-today";
import { RecentlyViewed, TrackRecentlyViewed } from "@/components/loja/recently-viewed";
import { toLiteProducts } from "@/components/loja/lite-product";

export const revalidate = 300;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export async function generateStaticParams() {
  // Roda em tempo de BUILD, quando não existe requisição -- por isso usa a
  // loja padrão explicitamente, em vez de getTenantId() (que depende do
  // endereço acessado). Lojas de outros tenants são geradas sob demanda.
  const products = await getAllProducts(LEGACY_TENANT_ID);
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/produto/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const tenantId = await getTenantId();
  const product = await getProductBySlug(tenantId, slug);
  if (!product) return {};
  const perfilMeta = await getStoreProfile(tenantId);

  const seoTitle = product.seoTitle?.trim();
  return {
    // O título escrito pelo dono (ou pela IA) já costuma trazer a marca: `absolute` evita
    // "… | Juliana Cestas | Juliana Cestas e Frios". Sem título próprio, o nome da cesta
    // recebe a marca do modelo do site (uma vez só).
    title: seoTitle ? { absolute: clampTitle(seoTitle) } : clampTitle(product.name),
    description: pickDescription(
      product.seoDescription || product.shortDescription,
      descricaoProdutoReserva(tenantId, perfilMeta, { nome: product.name, serves: product.serves, precoFormatado: currency.format(product.price) })
    ),
    alternates: { canonical: `/produto/${slug}` },
    // Ao compartilhar a cesta no WhatsApp/Facebook, a foto dela vai no cartão.
    openGraph: product.image ? { type: "website", locale: "pt_BR", images: [{ url: product.image }] } : undefined,
  };
}

export default async function ProdutoPage(
  props: PageProps<"/produto/[slug]">
) {
  const { slug } = await props.params;
  const tenantId = await getTenantId();
  // Loja com modelo instalado: a cesta REAL dentro do layout do modelo (sem modelo = a página de sempre).
  const instalado = await getTemaInstalado(tenantId);
  if (instalado) {
    const d = await dadosLoja(tenantId, "", instalado.variacao);
    return <ProdutoAoVivo tema={instalado.tema.key} d={d} slug={slug} Cartao={CARTOES[instalado.tema.key]} />;
  }
  const whatsapp = await getStoreWhatsapp(tenantId);
  const product = await getProductBySlug(tenantId, slug);
  if (!product) notFound();

  const whatsappMessage = encodeURIComponent(
    `Olá! Quero encomendar a ${product.name} (${currency.format(product.price)}).`
  );
  const [allProducts, delivery, alsoIds, perfilLoja, categoriaDoProduto] = await Promise.all([
    getAllProducts(tenantId),
    getDeliverySettings(tenantId).catch(() => null),
    getAlsoBought(tenantId, product.id).catch(() => []),
    getStoreProfile(tenantId),
    !ehLojaOriginal(tenantId) && product.categoryId ? getCategoryById(tenantId, product.categoryId).catch(() => null) : Promise.resolve(null),
  ]);
  const outrasCestas = allProducts.filter((item) => item.id !== product.id);
  // Só aparece com co-compra REAL de pelo menos 2 cestas (nunca palpite).
  const alsoBought = alsoIds
    .map((id) => allProducts.find((item) => item.id === id))
    .filter((item): item is (typeof allProducts)[number] => Boolean(item));
  const packagingItems = splitListText(product.packaging);

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">
      <TrackRecentlyViewed slug={product.slug} />
      <TrackViewItem item={{ id: product.id, name: product.name, price: product.price }} />
      <ProductJsonLd
        name={product.name}
        description={product.shortDescription || product.description || [product.serves, product.packaging].filter(Boolean).join(" — ")}
        priceCents={Math.round(product.price * 100)}
        images={product.images}
        slug={product.slug}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Início", path: "/" },
          { name: "Cestas", path: "/categoria/cafe-da-manha" },
          { name: product.name, path: `/produto/${product.slug}` },
        ]}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        {ehLojaOriginal(tenantId) ? (
          <>
            <Link href="/categoria/cafe-da-manha" className="transition-colors hover:text-primary">
              Cestas de café da manhã
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        ) : categoriaDoProduto ? (
          <>
            <Link href={`/categoria/${categoriaDoProduto.slug}`} className="transition-colors hover:text-primary">
              {categoriaDoProduto.name}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        ) : null}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} videoUrl={product.videoUrl} name={product.name} badge={product.badge} imageAlt={product.imageAlt} ribbon={product.ribbon} />

        <div className="jc-pop" style={{ animationDelay: "0.1s" }}>
          <h1 className="font-display text-3xl text-foreground md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {product.serves} · Tamanho {product.size}
          </p>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-bold tabular-nums text-foreground">
            {product.compareAtPrice ? (
              <s className="text-lg font-normal text-muted-foreground" aria-label={`de ${currency.format(product.compareAtPrice)}`}>
                {currency.format(product.compareAtPrice)}
              </s>
            ) : null}
            <span>{currency.format(product.price)}</span>
            {product.discountPct ? (
              <span
                className="rounded-full px-2.5 py-1 text-sm font-bold"
                style={{ background: product.ribbon?.bg ?? "#b3261e", color: product.ribbon?.text ?? "#ffffff" }}
              >
                -{product.discountPct}%
              </span>
            ) : null}
          </p>

          {delivery ? (
            <p className="mt-5 text-sm font-medium text-foreground">
              <DeliveryToday
                neutral={entregaNeutra(tenantId, perfilLoja)}
                settings={{
                  slotMinutes: delivery.slotMinutes,
                  leadTimeHours: delivery.leadTimeHours,
                  horizonDays: delivery.horizonDays,
                  hours: delivery.hours,
                  blockedDates: delivery.blockedDates,
                }}
              />
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/checkout/${product.slug}`}
              className="jc-btn-primary jc-shine-cta inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground"
            >
              Comprar
            </Link>
            <a
              href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
              data-track="lead"
              data-track-source="produto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--jc-whatsapp)] px-7 text-base font-semibold text-[var(--jc-whatsapp)] transition-colors hover:bg-[var(--jc-whatsapp)]/10 active:scale-[0.98]"
            >
              <MessageCircle className="size-5" />
              Falar no WhatsApp
            </a>
          </div>

          <div className="mt-3">
            <AddToCartButton
              productSlug={product.slug}
              productId={product.id}
              name={product.name}
              imageUrl={product.image || null}
              priceCents={Math.round(product.price * 100)}
            />
          </div>

          {product.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          ) : null}

          {product.items.length > 0 ? (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <PackageOpen aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
              O que vem na cesta
            </h2>
            {/* Duas colunas para os itens encaixarem lado a lado e não empurrarem
                o resto da página pra baixo. Vale no mobile também (colunas
                estreitas com nomes curtos); item longo quebra a linha dentro da
                própria coluna, sem estourar. */}
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
              {product.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ItemIcon name={item} className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          ) : null}

          {packagingItems.length > 0 ? (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
              Embalagem
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
              {packagingItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Gift aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.6} />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          ) : null}
        </div>
      </div>

      <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
        <CartaozinhoSection />
      </div>

      {alsoBought.length >= 2 ? (
        <div className="mt-16">
          <h2 className="font-display text-2xl text-foreground">Quem comprou esta cesta também levou</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4 2xl:grid-cols-6">
            {alsoBought.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}

      <RecentlyViewed products={toLiteProducts(allProducts)} excludeSlug={product.slug} />

      <div className="mt-16">
        <h2 className="font-display text-2xl text-foreground">
          Outras cestas
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4 2xl:grid-cols-6">
          {outrasCestas.map((item) => (
            <Reveal key={item.id}>
              <ProductCard product={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
