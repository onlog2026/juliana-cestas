import "server-only";
import { cache } from "react";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategories } from "@/modules/catalog/categories";
import type { Product } from "@/modules/catalog/product";
import type { ProdutoLoja } from "../types";

/** Converte um produto real da loja no formato que os cartões dos modelos desenham. */
export function paraProdutoLoja(p: Product, base: string, categoriaSlug: string): ProdutoLoja {
  return {
    slug: p.slug,
    nome: p.name,
    preco: p.price,
    precoDe: p.compareAtPrice,
    serve: p.serves || undefined,
    itens: p.items ?? [],
    descricao: p.description || p.shortDescription || "",
    fotos: p.images?.length ? p.images : [p.image],
    categoria: categoriaSlug,
    href: `${base}/produto/${p.slug}`,
  };
}

export type ProdutoComDados = { real: Product; loja: ProdutoLoja };

/**
 * Produtos REAIS da loja (com foto), cada um já nos dois formatos: o real (ids, datas, categoria)
 * e o do modelo. Uma leitura por requisição. Sempre pelo `tenantId` recebido.
 */
export const produtosDaLoja = cache(async (tenantId: string, base: string): Promise<ProdutoComDados[]> => {
  const [produtos, categorias] = await Promise.all([
    getAllProducts(tenantId).catch(() => [] as Product[]),
    getActiveCategories(tenantId).catch(() => []),
  ]);
  const slugPorId = new Map(categorias.map((c) => [c.id, c.slug] as const));
  return produtos
    .filter((p) => p.image)
    .map((real) => ({ real, loja: paraProdutoLoja(real, base, (real.categoryId && slugPorId.get(real.categoryId)) || "") }));
});
