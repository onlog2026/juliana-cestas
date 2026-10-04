import { notFound } from "next/navigation";
import { CABECALHOS, HOMES, RODAPES } from "./index";
import { PaginaCarrinho, PaginaCategoria, PaginaProduto } from "./paginas";
import type { DadosLoja, TemaKey } from "./types";

/**
 * Monta a página certa do modelo para um caminho: início, /categoria, /categoria/<slug>,
 * /produto/<slug>, /carrinho. Usada pela loja demo e pela prévia com os produtos do
 * lojista — as duas mostram exatamente o mesmo motor, só muda a fonte dos dados.
 */
export function RotaLoja({ tema, d, rota }: { tema: TemaKey; d: DadosLoja; rota: string[] }) {
  const [a, b] = rota;
  let corpo;
  if (rota.length === 0) {
    const Home = HOMES[tema];
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
  const Cabecalho = CABECALHOS[tema];
  const Rodape = RODAPES[tema];
  return (
    <>
      <Cabecalho d={d} />
      {corpo}
      <Rodape d={d} />
    </>
  );
}
