import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getAllProducts, getProductBySlug } from "@/modules/catalog/service";
import { getCategoryById } from "@/modules/catalog/categories";
import { getAlsoBought } from "@/modules/catalog/also-bought";
import { getDeliverySettings } from "@/modules/delivery/settings";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { entregaNeutra } from "@/modules/seo/texto-legado";
import { splitListText } from "@/modules/catalog/list-text";
import { getTenantId } from "@/lib/tenant/context";
import { AddToCartButton } from "@/components/loja/add-to-cart-button";
import { DeliveryToday } from "@/components/loja/delivery-today";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/loja/json-ld";
import { TrackRecentlyViewed } from "@/components/loja/recently-viewed";
import { INTERNAS } from "../internas";
import { BlocoAvaliacoes, BlocoCartaozinho, BlocoVistos, CartaoPadrao, ESTILO_COMPRA, RastreioCesta, paraProdutoLoja } from "../blocos";
import type { CartaoModelo, EncaixesProduto, PropsProdutoModelo } from "../encaixes";
import type { DadosLoja, TemaKey } from "../types";

// removido quando os modelos aceitarem os encaixes (aí `INTERNAS[tema].Produto` já terá este tipo).
type ProdutoComEncaixes = ComponentType<PropsProdutoModelo>;

/**
 * Página da cesta AO VIVO com o layout do modelo: busca a cesta real (como `(store)/produto/[slug]`),
 * monta os encaixes com os componentes reais e entrega tudo ao `Produto` do modelo.
 * O `generateMetadata`/`revalidate` continuam na rota. Cesta inexistente = 404.
 */
export async function ProdutoAoVivo({ tema, d, slug, Cartao }: { tema: TemaKey; d: DadosLoja; slug: string; Cartao?: CartaoModelo }) {
  const tenantId = await getTenantId();
  const product = await getProductBySlug(tenantId, slug);
  if (!product) notFound();

  const [todos, delivery, alsoIds, perfil, whatsapp, categoria] = await Promise.all([
    getAllProducts(tenantId),
    getDeliverySettings(tenantId).catch(() => null),
    getAlsoBought(tenantId, product.id).catch(() => []),
    getStoreProfile(tenantId),
    getStoreWhatsapp(tenantId),
    product.categoryId ? getCategoryById(tenantId, product.categoryId).catch(() => null) : Promise.resolve(null),
  ]);
  const base = d.base;
  const zapDigitos = (whatsapp ?? "").replace(/\D/g, "");
  const preco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price);
  const mensagem = encodeURIComponent(`Olá! Quero encomendar a ${product.name} (${preco}).`);
  const embalagem = splitListText(product.packaging);
  const tambem = alsoIds.map((id) => todos.find((x) => x.id === id)).filter((x): x is (typeof todos)[number] => Boolean(x));
  const Card = Cartao ?? CartaoPadrao;

  const encaixes: EncaixesProduto = {
    compra: (
      <div data-recurso="compra" className="flex min-w-0 flex-col gap-3">
        <style dangerouslySetInnerHTML={{ __html: ESTILO_COMPRA }} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`${base}/checkout/${product.slug}`}
            data-acao="comprar"
            className="inline-flex min-h-12 items-center justify-center rounded-full px-7 text-base font-semibold"
            style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}
          >
            Comprar
          </Link>
          {zapDigitos ? (
            <a
              href={`https://wa.me/${zapDigitos}?text=${mensagem}`}
              data-track="lead"
              data-track-source="produto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-7 text-base font-semibold"
              style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          ) : null}
        </div>
        <AddToCartButton
          productSlug={product.slug}
          productId={product.id}
          name={product.name}
          imageUrl={product.image || null}
          priceCents={Math.round(product.price * 100)}
        />
      </div>
    ),
    entrega: delivery ? (
      <span data-recurso="entrega" className="text-sm font-medium">
        <DeliveryToday
          neutral={entregaNeutra(tenantId, perfil)}
          settings={{
            slotMinutes: delivery.slotMinutes,
            leadTimeHours: delivery.leadTimeHours,
            horizonDays: delivery.horizonDays,
            hours: delivery.hours,
            blockedDates: delivery.blockedDates,
          }}
        />
      </span>
    ) : null,
    avaliacoes: <BlocoAvaliacoes />,
    // Só com co-compra REAL de pelo menos 2 cestas (nunca palpite).
    quemComprou:
      tambem.length >= 2 ? (
        <section data-recurso="quem-comprou" className="min-w-0">
          <h2 className="text-2xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-fg)" }}>Quem comprou esta cesta também levou</h2>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {tambem.map((p) => (
              <div key={p.id} className="min-w-0">
                <Card p={paraProdutoLoja(p, base, "")} />
              </div>
            ))}
          </div>
        </section>
      ) : null,
    vistos: <BlocoVistos base={base} Cartao={Cartao} slugAtual={product.slug} />,
    extras: (
      <div data-recurso="extras" className="min-w-0">
        {embalagem.length > 0 ? (
          <section className="mb-10">
            <h2 className="text-sm font-semibold" style={{ color: "var(--t-fg)" }}>Embalagem</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
              {embalagem.map((item) => (
                <li key={item} className="min-w-0 text-sm" style={{ color: "var(--t-muted)" }}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <BlocoCartaozinho />
      </div>
    ),
  };

  const Modelo = INTERNAS[tema].Produto as unknown as ProdutoComEncaixes;
  return (
    <>
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
          ...(categoria ? [{ name: categoria.name, path: `/categoria/${categoria.slug}` }] : []),
          { name: product.name, path: `/produto/${product.slug}` },
        ]}
      />
      <RastreioCesta id={product.id} nome={product.name} preco={product.price} />
      <TrackRecentlyViewed slug={product.slug} />
      <Modelo d={d} slug={slug} encaixes={encaixes} />
    </>
  );
}
