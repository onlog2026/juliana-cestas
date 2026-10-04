import "server-only";
import { getAllProducts } from "@/modules/catalog/service";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import type { DadosLoja, ProdutoLoja, Variacao } from "./types";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Loja de EXEMPLO de uma variação: nome fictício, textos da variação, categorias da
 * variação e as cestas reais da plataforma (uso autorizado) distribuídas nelas.
 * Todos os links são reais dentro de `base` (ex.: "/demo/noir/vinhos"); o checkout é desligado.
 */
export async function dadosDemo(v: Variacao, base: string): Promise<DadosLoja> {
  const todos = await getAllProducts(LEGACY_TENANT_ID).catch(() => []);
  const comFoto = todos.filter((p) => p.image);
  // As cestas escolhidas para a variação vêm primeiro; o resto completa o catálogo.
  const prefer = new Map(v.demo.cestas.map((s, i) => [s, i] as const));
  const ordenados = [...comFoto].sort((a, b) => (prefer.get(a.slug) ?? 999) - (prefer.get(b.slug) ?? 999));

  const nCat = Math.max(v.demo.categorias.length, 1);
  const categoriaSlugs = v.demo.categorias.map(slugify);

  const produtos: ProdutoLoja[] = ordenados.map((p, i) => ({
    slug: p.slug,
    nome: p.name,
    preco: p.price,
    precoDe: p.compareAtPrice,
    serve: p.serves || undefined,
    itens: p.items ?? [],
    descricao: p.description || p.shortDescription || "Montada à mão, no dia da entrega, com cartão escrito do seu jeito.",
    fotos: p.images?.length ? p.images : [p.image],
    categoria: categoriaSlugs[i % nCat],
    href: `${base}/produto/${p.slug}`,
  }));

  const heroImagem = v.demo.heroImagem.startsWith("slug:")
    ? produtos.find((p) => p.slug === v.demo.heroImagem.slice(5))?.fotos[0] || produtos[0]?.fotos[0] || ""
    : v.demo.heroImagem;

  const categorias = v.demo.categorias.map((nome, i) => {
    const slug = categoriaSlugs[i];
    const amostra = produtos.find((p) => p.categoria === slug);
    return { slug, nome, imagem: amostra?.fotos[0] ?? "", href: `${base}/categoria/${slug}` };
  });

  return {
    base,
    demo: true,
    loja: v.demo.loja,
    aviso: v.demo.aviso,
    titulo: v.demo.titulo,
    texto: v.demo.texto,
    heroImagem,
    categorias,
    produtos,
    cestas: produtos.slice(0, 10).map((p) => ({ nome: p.nome, preco: p.preco, precoDe: p.precoDe, imagem: p.fotos[0], serve: p.serve, href: p.href })),
  };
}
