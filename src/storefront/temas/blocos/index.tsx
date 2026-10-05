import { Children, type ReactNode } from "react";
import { getTenantId } from "@/lib/tenant/context";
import { HeaderSearch } from "@/components/loja/header-search";
import { ShowcaseCarousel } from "@/components/loja/showcase-carousel";
import { PromoBanners } from "@/components/loja/promo-banners";
import { TrackRecentlyViewed } from "@/components/loja/recently-viewed";
import { ReviewsShowcase } from "@/components/loja/reviews/reviews-showcase";
import { TrustBar } from "@/components/loja/trust-bar";
import { Benefits } from "@/components/loja/benefits";
import { Faq } from "@/components/loja/faq";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";
import { CartaozinhoSection } from "@/components/loja/cartaozinho-section";
import { ItemIcon } from "@/components/loja/item-icon";
import { ItemListJsonLd, WebSiteJsonLd } from "@/components/loja/json-ld";
import { TrackViewItem } from "@/components/analytics/track-events";
import { getShowcases, getSoldUnits } from "@/modules/catalog/showcases";
import { getActiveCategories } from "@/modules/catalog/categories";
import { getContent } from "@/modules/content/service";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { nomeLojaReserva } from "@/modules/seo/texto-legado";
import { isPublicCategory } from "@/modules/seo/public-category";
import type { CartaoModelo } from "../encaixes";
import type { ProdutoLoja } from "../types";
import { CartaoPadrao } from "./cartao-padrao";
import { CartaoRastreado } from "./cartao-rastreado";
import { GradeCliente, type CategoriaGrade, type EntradaGrade } from "./grade-cliente";
import { VistosCliente } from "./vistos-cliente";
import { produtosDaLoja } from "./dados";

/**
 * KIT DE BLOCOS FUNCIONAIS (componentes de SERVIDOR). Cada bloco busca os dados REAIS da loja pelo
 * `getTenantId()`, reaproveita os componentes de `components/loja/*` e marca `data-recurso="<nome>"`
 * na raiz (o teste de paridade confere esse atributo). O modelo só decide a posição e passa o SEU
 * cartão de produto em `Cartao` (sem ele, usa o `CartaoPadrao`, só com variáveis `--t-*`).
 *
 * Todos assumem estar dentro do `TemaRoot` do modelo (é ele que define `--t-*` e as variáveis que os
 * componentes antigos leem). `base` = prefixo dos links ("" na loja ao vivo).
 * Blocos que dependem de dados que podem não existir (vitrines, banners, grade) devolvem `null`
 * sem dados — seção vazia é pior que seção ausente.
 */

type Comum = { base?: string };
type ComCartao = Comum & { Cartao?: CartaoModelo };

const LARGURA = "mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 2xl:px-12";

function cartaoDe(Cartao: CartaoModelo | undefined, p: ProdutoLoja, id: string): ReactNode {
  const C = Cartao ?? CartaoPadrao;
  return (
    <CartaoRastreado productId={id}>
      <C p={p} />
    </CartaoRastreado>
  );
}

/** Caixa de busca com sugestões (nome e "serve para"), igual à da loja original. */
export async function BlocoBusca({ base = "", id = "busca-modelo" }: Comum & { id?: string }) {
  const tenantId = await getTenantId();
  const itens = await produtosDaLoja(tenantId, base);
  const produtos = itens.map(({ real }) => ({ slug: real.slug, name: real.name, serves: real.serves, price: real.price, image: real.image }));
  return (
    <div data-recurso="busca" className="w-full min-w-0">
      <HeaderSearch products={produtos} id={id} />
    </div>
  );
}

/** "Mais comprados" e "Mais clicados": só aparecem com dados reais suficientes (>= 4 produtos cada). */
export async function BlocoVitrines({ base = "", Cartao }: ComCartao) {
  const tenantId = await getTenantId();
  const itens = await produtosDaLoja(tenantId, base);
  if (itens.length === 0) return null;
  const vitrines = await getShowcases(tenantId, itens.map((i) => i.real));
  const lojaPorId = new Map(itens.map((i) => [i.real.id, i.loja] as const));
  const monta = (lista: typeof vitrines.bought) =>
    lista.flatMap((p) => {
      const loja = lojaPorId.get(p.id);
      return loja ? [{ id: p.id, node: cartaoDe(Cartao, loja, p.id) }] : [];
    });
  const comprados = monta(vitrines.bought);
  const clicados = monta(vitrines.clicked);
  if (comprados.length === 0 && clicados.length === 0) return null;
  return (
    <div data-recurso="vitrines">
      {comprados.length > 0 ? <ShowcaseCarousel title="Mais comprados" items={comprados} /> : null}
      {clicados.length > 0 ? <ShowcaseCarousel title="Mais clicados" items={clicados} /> : null}
    </div>
  );
}

/**
 * "Vistos recentemente" (histórico do navegador). Na página da cesta passe `slugAtual`: ele é
 * gravado no histórico e não aparece na própria lista.
 */
export async function BlocoVistos({ base = "", Cartao, slugAtual }: ComCartao & { slugAtual?: string }) {
  const tenantId = await getTenantId();
  const itens = await produtosDaLoja(tenantId, base);
  const lista = itens.slice(0, 40).map(({ real, loja }) => ({ slug: real.slug, id: real.id, node: cartaoDe(Cartao, loja, real.id) }));
  return (
    <div data-recurso="vistos">
      {slugAtual ? <TrackRecentlyViewed slug={slugAtual} /> : null}
      <VistosCliente itens={lista} excluir={slugAtual} titulo="Vistos recentemente" />
    </div>
  );
}

/** Avaliações aprovadas da loja (vazio quando não há nenhuma — nunca inventa prova social). */
export async function BlocoAvaliacoes({ limite = 12 }: { limite?: number }) {
  return (
    <div data-recurso="avaliacoes">
      <ReviewsShowcase limit={limite} />
    </div>
  );
}

/** Faixa de confiança: nota real, entrega e cartão de mensagem. */
export async function BlocoConfianca() {
  return (
    <div data-recurso="confianca">
      <TrustBar />
    </div>
  );
}

/** Benefícios (entrega, atendimento etc.), editáveis pelo lojista no painel. */
export async function BlocoBeneficios() {
  return (
    <div data-recurso="beneficios">
      <Benefits />
    </div>
  );
}

/** Perguntas frequentes, editáveis pelo lojista no painel. */
export async function BlocoFaq() {
  return (
    <div data-recurso="faq">
      <Faq />
    </div>
  );
}

/** Chamada para o WhatsApp da loja (número do cadastro da loja). */
export async function BlocoWhatsapp() {
  return (
    <div data-recurso="whatsapp">
      <WhatsappCta />
    </div>
  );
}

/** Bloco do cartãozinho personalizado (prévia ao vivo do cartão de mensagem). */
export async function BlocoCartaozinho() {
  return (
    <div data-recurso="cartaozinho">
      <CartaozinhoSection />
    </div>
  );
}

/** Banners promocionais (largo + estreito) configurados no painel; desligados ou sem imagem = nada. */
export async function BlocoBannersPromo() {
  const tenantId = await getTenantId();
  const promo = await getContent(tenantId, "promo_banners");
  if (!promo.enabled || (!promo.wide.imageUrl && !promo.narrow.imageUrl)) return null;
  return (
    <div data-recurso="banners-promo" className={`${LARGURA} py-6`}>
      <PromoBanners promo={promo} />
    </div>
  );
}

/**
 * Grade com ordenação (destaques, preço, novidades, mais pedidos) e filtros (categoria e faixa de preço),
 * com o cartão do modelo. `categoriaSlug` = só aquela categoria (e subcategorias), sem chips de categoria.
 * `classeGrade` define as colunas.
 */
export async function BlocoGradeOrdenavel({
  base = "",
  Cartao,
  titulo,
  categoriaSlug,
  classeGrade,
  limite,
}: ComCartao & { titulo?: string; categoriaSlug?: string; classeGrade?: string; limite?: number }) {
  const tenantId = await getTenantId();
  const [itens, categorias, vendidos] = await Promise.all([
    produtosDaLoja(tenantId, base),
    getActiveCategories(tenantId).catch(() => []),
    getSoldUnits(tenantId),
  ]);
  const publicas = categorias.filter(isPublicCategory);
  const idsDe = (id: string) => [id, ...publicas.filter((c) => c.parentId === id).map((c) => c.id)];
  const raiz = categoriaSlug ? publicas.find((c) => c.slug === categoriaSlug) : undefined;
  const idsRaiz = raiz ? new Set(idsDe(raiz.id)) : null;

  const entradas: EntradaGrade[] = itens
    .filter(({ real }) => !idsRaiz || (real.categoryId && idsRaiz.has(real.categoryId)))
    .map(({ real, loja }, i) => ({
      id: real.id,
      categoryId: real.categoryId,
      order: i,
      price: real.price,
      createdAt: real.createdAt ?? "",
      sold: vendidos.get(real.id) ?? 0,
      node: cartaoDe(Cartao, loja, real.id),
    }));
  if (entradas.length === 0) return null;

  const chips: CategoriaGrade[] = categoriaSlug
    ? []
    : publicas
        .filter((c) => !c.parentId)
        .map((c) => ({ slug: c.slug, name: c.name, ids: idsDe(c.id) }))
        .filter((c) => entradas.some((e) => e.categoryId && c.ids.includes(e.categoryId)));

  return (
    <section data-recurso="grade-ordenavel" className="min-w-0">
      {titulo ? <h2 className="mb-6 text-2xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-fg)" }}>{titulo}</h2> : null}
      <GradeCliente entradas={entradas} categorias={chips} classeGrade={classeGrade} limite={limite} />
    </section>
  );
}

/** Dados estruturados da página inicial (WebSite + lista de cestas) para o Google. Não desenha nada. */
export async function JsonLdHome({ nome }: { nome?: string }) {
  const tenantId = await getTenantId();
  const [perfil, itens] = await Promise.all([getStoreProfile(tenantId), produtosDaLoja(tenantId, "")]);
  const loja = nome?.trim() || perfil.businessName?.trim() || nomeLojaReserva(tenantId);
  return (
    <div hidden data-recurso="jsonld-home">
      <WebSiteJsonLd name={loja} />
      <ItemListJsonLd items={itens.slice(0, 12).map(({ real }) => ({ name: real.name, slug: real.slug }))} />
    </div>
  );
}

/** Avisa a análise (view_item) que a cesta foi aberta. Não desenha nada. */
export function RastreioCesta({ id, nome, preco }: { id: string; nome: string; preco: number }) {
  return (
    <span hidden data-recurso="rastreio">
      <TrackViewItem item={{ id, name: nome, price: preco }} />
    </span>
  );
}

/** Lista "o que vem na cesta" com o ícone de cada item (para os modelos que quiserem a mesma lista da loja). */
export function ItensComIcone({ itens }: { itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <ul data-recurso="itens" className="grid grid-cols-2 gap-x-5 gap-y-2">
      {Children.toArray(
        itens.map((item) => (
          <li className="flex items-start gap-2 text-sm" style={{ color: "var(--t-muted)" }}>
            <ItemIcon name={item} className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">{item}</span>
          </li>
        ))
      )}
    </ul>
  );
}

export { CartaoPadrao } from "./cartao-padrao";
export { produtosDaLoja, paraProdutoLoja } from "./dados";
export { ESTILO_COMPRA } from "./estilo";
