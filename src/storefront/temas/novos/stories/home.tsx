import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { Historias, type Grupo } from "./historias";
import { Avatar, COL, COL_STYLE, Post } from "./post";

/** STORIES (início) — círculos de histórias, apresentação da loja, feed de posts e grade de categorias. */
export function Home({ d }: { d: DadosLoja }) {
  // Cada categoria vira uma história: as cestas dela (ou os destaques, se a categoria ainda não tiver cestas).
  const grupos: Grupo[] = d.categorias.map((c) => {
    const doGrupo = d.produtos.filter((p) => p.categoria === c.slug).slice(0, 5).map((p) => ({ nome: p.nome, preco: brl(p.preco), imagem: p.fotos[0] ?? c.imagem, href: p.href }));
    const slides = doGrupo.length ? doGrupo : d.cestas.slice(0, 4).map((x) => ({ nome: x.nome, preco: brl(x.preco), imagem: x.imagem, href: x.href }));
    return { chave: c.slug, nome: c.nome, imagem: c.imagem, hrefCategoria: c.href, slides };
  }).filter((g) => g.slides.length > 0);

  return (
    <main className={COL} style={COL_STYLE}>
      {grupos.length ? <Historias grupos={grupos} /> : null}

      <section className="flex min-w-0 items-center gap-4 border-y px-4 py-5 md:px-6 lg:px-10" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <Avatar imagem={d.heroImagem} alt="" tamanho="size-20" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-tight font-bold" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
        </div>
      </section>

      <section aria-label="Novidades" className="mt-2 md:mt-5 md:grid md:grid-cols-2 md:gap-5 md:px-6 lg:grid-cols-3 lg:px-10 2xl:grid-cols-4">
        {d.cestas.slice(0, 8).map((c) => <Post key={c.href} p={c} loja={d.loja} avatar={d.heroImagem} />)}
      </section>

      <section className="px-4 pt-8 md:px-6 lg:px-10" aria-labelledby="explorar">
        <h2 id="explorar" className="text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Explorar por ocasião</h2>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 md:grid-cols-4 lg:grid-cols-6">
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="group block min-w-0">
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={c.imagem} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
              </div>
              <p className="mt-2 truncate text-center text-sm font-semibold">{c.nome}</p>
            </a>
          ))}
        </div>
        <a href={`${d.base}/categoria`} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full border font-semibold" style={{ borderColor: "var(--t-line)" }}>Ver todas as cestas</a>
      </section>
    </main>
  );
}
