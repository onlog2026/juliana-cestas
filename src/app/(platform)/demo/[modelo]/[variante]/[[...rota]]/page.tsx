import { notFound } from "next/navigation";
import { CABECALHOS, HOMES, RODAPES, getTema, getVariacao } from "@/storefront/temas";
import { dadosDemo } from "@/storefront/temas/dados-demo";
import { PaginaCarrinho, PaginaCategoria, PaginaProduto } from "@/storefront/temas/paginas";

export const dynamic = "force-dynamic";

/**
 * Loja de DEMONSTRAÇÃO navegável: início, /categoria, /categoria/<slug>, /produto/<slug>,
 * /carrinho. Mesmos componentes que a loja de verdade usa (só muda a fonte dos dados).
 */
export default async function DemoPagina(props: { params: Promise<{ modelo: string; variante: string; rota?: string[] }> }) {
  const { modelo, variante, rota = [] } = await props.params;
  const tema = getTema(modelo);
  if (!tema) notFound();
  const v = getVariacao(tema, variante);
  const base = `/demo/${tema.key}/${v.key}`;
  const d = await dadosDemo(v, base);

  const [a, b] = rota;
  let corpo;
  if (rota.length === 0) {
    const Home = HOMES[tema.key];
    corpo = <Home d={d} />;
  } else if (a === "categoria" && rota.length <= 2) {
    if (b && !d.categorias.some((c) => c.slug === b)) notFound();
    corpo = <PaginaCategoria d={d} slug={b} />;
  } else if (a === "produto" && b && rota.length === 2) {
    if (!d.produtos.some((p) => p.slug === b)) notFound();
    corpo = <PaginaProduto d={d} slug={b} />;
  } else if (a === "carrinho" && rota.length === 1) {
    corpo = <PaginaCarrinho d={d} />;
  } else {
    notFound();
  }

  const Cabecalho = CABECALHOS[tema.key];
  const Rodape = RODAPES[tema.key];
  return (
    <>
      <Cabecalho d={d} />
      {corpo}
      <Rodape d={d} />
    </>
  );
}
