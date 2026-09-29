import Image from "next/image";
import Link from "next/link";
import { getTenantId } from "@/lib/tenant/context";
import { getActiveCategoryTree } from "@/modules/catalog/categories";

/**
 * Faixa de atalhos das categorias REAIS da loja (Cestas, Frios, Dica para
 * Ela/Ele...), logo abaixo do banner. Substitui o bloco antigo que repetia a
 * lista de produtos com o nome de "categorias". No celular rola de lado (com
 * "ímã" em cada item); no computador quebra linha se precisar. Alvo de toque
 * ≥ 64px. Sem categoria cadastrada, não renderiza nada.
 */
export async function CategoryShortcuts() {
  const tree = await getActiveCategoryTree(await getTenantId());
  if (tree.length === 0) return null;

  return (
    <nav aria-label="Categorias" className="mx-auto max-w-[1800px] px-4 pt-6 sm:px-6 lg:px-8 2xl:px-12">
      <ul className="flex snap-x gap-4 overflow-x-auto pb-4 pt-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {tree.map((category) => (
          <li key={category.id} className="shrink-0 snap-start">
            <Link
              href={`/categoria/${category.slug}`}
              className="group flex w-[5.5rem] flex-col items-center gap-2 text-center sm:w-28"
            >
              <span className="jc-ring">
                <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-secondary sm:size-20">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 80px, 64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-display text-xl text-primary" aria-hidden="true">
                    {category.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                </span>
              </span>
              <span className="text-xs font-medium leading-tight text-foreground">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
