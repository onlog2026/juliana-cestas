import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/loja/json-ld";
import { getCategoryAndDescendantIds, getCategoryBySlug, getCategoryById, getSubcategories } from "@/modules/catalog/categories";
import { getProductsByCategoryIds } from "@/modules/catalog/service";
import { getTenantId } from "@/lib/tenant/context";
import { INTERNAS } from "../internas";
import { BlocoFaq, BlocoWhatsapp } from "../blocos";
import type { EncaixesCategoria, PropsCategoriaModelo } from "../encaixes";
import type { DadosLoja, TemaKey } from "../types";

// removido quando os modelos aceitarem os encaixes (aí `INTERNAS[tema].Categoria` já terá este tipo).
type CategoriaComEncaixes = ComponentType<PropsCategoriaModelo>;

/**
 * Página de categoria AO VIVO com o layout do modelo (como `(store)/categoria/[slug]`): categoria
 * principal mostra as cestas dela E das subcategorias; ajusta os dados para o modelo (que filtra por
 * slug exato) e preenche os encaixes (atalhos de subcategoria; perguntas frequentes e WhatsApp).
 * Categoria inexistente = 404. `generateMetadata`/`revalidate` continuam na rota.
 */
export async function CategoriaAoVivo({ tema, d, slug }: { tema: TemaKey; d: DadosLoja; slug: string }) {
  const tenantId = await getTenantId();
  const category = await getCategoryBySlug(tenantId, slug);
  if (!category) notFound();

  const [ids, subcategorias, pai] = await Promise.all([
    getCategoryAndDescendantIds(tenantId, category),
    category.parentId ? Promise.resolve([]) : getSubcategories(tenantId, category.id),
    category.parentId ? getCategoryById(tenantId, category.parentId) : Promise.resolve(null),
  ]);
  const produtos = await getProductsByCategoryIds(tenantId, ids);

  // O modelo lista só as cestas cuja categoria == slug da página. Na categoria principal, as das
  // subcategorias passam a contar como dela; e a própria categoria precisa existir em `categorias`
  // (o `dadosLoja` omite categoria sem cesta direta).
  const slugsFilhas = new Set(subcategorias.map((s) => s.slug));
  const produtosD = d.produtos.map((p) => (slugsFilhas.has(p.categoria) ? { ...p, categoria: slug } : p));
  const existe = d.categorias.some((c) => c.slug === slug);
  const categoriasD = existe
    ? d.categorias
    : [
        ...d.categorias,
        { slug, nome: category.name, imagem: category.imageUrl || produtosD.find((p) => p.categoria === slug)?.fotos[0] || "", href: `${d.base}/categoria/${slug}` },
      ];
  const dPagina: DadosLoja = { ...d, produtos: produtosD, categorias: categoriasD };

  const encaixes: EncaixesCategoria = {
    filtrosExtras:
      subcategorias.length > 0 ? (
        <nav data-recurso="subcategorias" aria-label="Subcategorias" className="flex flex-wrap gap-2">
          {subcategorias.map((s) => (
            <a
              key={s.id}
              href={`${d.base}/categoria/${s.slug}`}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium"
              style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}
            >
              {s.name}
            </a>
          ))}
        </nav>
      ) : null,
    rodape: (
      <div data-recurso="rodape-categoria">
        <BlocoFaq />
        <BlocoWhatsapp />
      </div>
    ),
  };

  const Modelo = INTERNAS[tema].Categoria as unknown as CategoriaComEncaixes;
  return (
    <>
      <BreadcrumbJsonLd
        trail={[
          { name: "Início", path: "/" },
          ...(pai ? [{ name: pai.name, path: `/categoria/${pai.slug}` }] : []),
          { name: category.name, path: `/categoria/${category.slug}` },
        ]}
      />
      {produtos.length > 0 ? <ItemListJsonLd items={produtos.slice(0, 30).map((p) => ({ name: p.name, slug: p.slug }))} /> : null}
      <Modelo d={dPagina} slug={slug} encaixes={encaixes} />
    </>
  );
}
