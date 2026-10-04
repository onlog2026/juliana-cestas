import "server-only";
import { getAllProducts } from "@/modules/catalog/service";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import type { DadosLoja, Variacao } from "./types";

/**
 * Monta os dados da loja de EXEMPLO de uma variação: nome fictício, textos da
 * variação e fotos/preços de cestas reais da plataforma (uso autorizado).
 * Links das cestas não levam a lugar nenhum (é vitrine de demonstração).
 */
export async function dadosDemo(v: Variacao): Promise<DadosLoja> {
  const produtos = await getAllProducts(LEGACY_TENANT_ID).catch(() => []);
  const porSlug = new Map(produtos.map((p) => [p.slug, p] as const));
  const cestas = v.demo.cestas
    .map((s) => porSlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p && p.image))
    .map((p) => ({
      nome: p.name,
      preco: p.price,
      precoDe: p.compareAtPrice,
      imagem: p.image,
      serve: p.serves || undefined,
      href: "#",
    }));
  const heroImagem = v.demo.heroImagem.startsWith("slug:")
    ? porSlug.get(v.demo.heroImagem.slice(5))?.image || cestas[0]?.imagem || ""
    : v.demo.heroImagem;
  return {
    loja: v.demo.loja,
    aviso: v.demo.aviso,
    titulo: v.demo.titulo,
    texto: v.demo.texto,
    heroImagem,
    categorias: v.demo.categorias.map((nome, i) => ({ nome, imagem: cestas[(i + 1) % Math.max(cestas.length, 1)]?.imagem ?? "" })),
    cestas,
  };
}
