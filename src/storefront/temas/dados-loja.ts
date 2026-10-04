import "server-only";
import { cache } from "react";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategories } from "@/modules/catalog/categories";
import { getActiveBanners } from "@/modules/banners/service";
import { getContent } from "@/modules/content/service";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getSeoSettings } from "@/modules/seo/service";
import { isPublicCategory } from "@/modules/seo/public-category";
import { dadosDemo } from "./dados-demo";
import type { DadosLoja, ProdutoLoja, Variacao } from "./types";

/**
 * Dados da loja REAL do lojista (cestas, categorias, banners, textos, WhatsApp),
 * no mesmo formato da demo — é isso que faz a prévia e a loja instalada mostrarem
 * os produtos DELE no modelo escolhido. Sempre pelo `tenantId` da sessão/host.
 *
 * Loja sem cestas ainda: usa as cestas de exemplo da variação (marcadas `exemplo`)
 * para a prévia não ficar vazia.
 */
export const dadosLoja = cache(dadosLojaSemCache);

async function dadosLojaSemCache(tenantId: string, base: string, v: Variacao): Promise<DadosLoja & { exemplo: boolean }> {
  const [produtosBanco, categoriasBanco, banners, perfil, aviso, seo] = await Promise.all([
    getAllProducts(tenantId).catch(() => []),
    getActiveCategories(tenantId).catch(() => []),
    getActiveBanners(tenantId).catch(() => []),
    getStoreProfile(tenantId),
    getContent(tenantId, "announcement").catch(() => null),
    getSeoSettings(tenantId).catch(() => null),
  ]);

  const comFoto = produtosBanco.filter((p) => p.image);
  if (comFoto.length === 0) {
    const demo = await dadosDemo(v, base);
    return { ...demo, demo: false, loja: perfil.businessName?.trim() || demo.loja, exemplo: true };
  }

  const cats = categoriasBanco.filter(isPublicCategory).filter((c) => c.slug);
  const categoriaPorId = new Map(cats.map((c) => [c.id, c.slug] as const));
  const produtos: ProdutoLoja[] = comFoto.map((p) => ({
    slug: p.slug,
    nome: p.name,
    preco: p.price,
    precoDe: p.compareAtPrice,
    serve: p.serves || undefined,
    itens: p.items ?? [],
    descricao: p.description || p.shortDescription || "",
    fotos: p.images?.length ? p.images : [p.image],
    categoria: (p.categoryId && categoriaPorId.get(p.categoryId)) || "",
    href: `${base}/produto/${p.slug}`,
  }));

  const categorias = cats
    .map((c) => {
      const amostra = produtos.find((p) => p.categoria === c.slug);
      return { slug: c.slug, nome: c.name, imagem: c.imageUrl || amostra?.fotos[0] || "", href: `${base}/categoria/${c.slug}`, _tem: Boolean(amostra) };
    })
    .filter((c) => c._tem)
    .map(({ _tem, ...c }) => c);

  const banner = banners[0];
  const whatsapp = (perfil.phone ?? "").replace(/\D/g, "") || undefined;
  return {
    base,
    demo: false,
    exemplo: false,
    loja: perfil.businessName?.trim() || "Minha loja",
    aviso: aviso && aviso.enabled && aviso.text ? aviso.text : "Entrega com data e horário marcados",
    titulo: banner?.text?.trim() || perfil.businessName?.trim() || "Cestas feitas à mão",
    texto: seo?.siteDescription?.trim() || "Escolha a cesta, a data e o horário. A gente cuida do resto.",
    heroImagem: banner?.image || produtos[0].fotos[0],
    whatsapp,
    categorias,
    produtos,
    cestas: produtos.slice(0, 10).map((p) => ({ nome: p.nome, preco: p.preco, precoDe: p.precoDe, imagem: p.fotos[0], serve: p.serve, href: p.href })),
  };
}
