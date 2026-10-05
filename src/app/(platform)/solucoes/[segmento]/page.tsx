import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlataformaShell } from "@/components/platform/site/shell";
import { RECURSOS } from "@/modules/platform/recursos";
import { SOLUCOES, getSolucao } from "@/modules/platform/solucoes";
import { ServicoHero } from "@/components/platform/servicos/hero";
import { Problema } from "@/components/platform/servicos/problema";
import { Secao } from "@/components/platform/servicos/secao";
import { ListaGanhos } from "@/components/platform/servicos/beneficios";
import { Passos } from "@/components/platform/servicos/passos";
import { Faq } from "@/components/platform/servicos/faq";
import { Relacionados } from "@/components/platform/servicos/relacionados";
import { CtaFinal } from "@/components/platform/servicos/cta";
import { JsonLdPagina } from "@/components/platform/servicos/json-ld";

/** Uma única página dirigida por dados (`src/modules/platform/solucoes.ts`), pré-gerada para cada situação. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUCOES.map((s) => ({ segmento: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ segmento: string }> }): Promise<Metadata> {
  const { segmento } = await params;
  const s = getSolucao(segmento);
  if (!s) return {};
  return {
    title: { absolute: s.seoTitulo },
    description: s.seoDescricao,
    alternates: { canonical: `/solucoes/${s.slug}` },
    openGraph: { title: s.seoTitulo, description: s.seoDescricao, type: "website", locale: "pt_BR", url: `/solucoes/${s.slug}` },
  };
}

export default async function SolucaoPage({ params }: { params: Promise<{ segmento: string }> }) {
  const { segmento } = await params;
  const s = getSolucao(segmento);
  if (!s) notFound();

  const recursos = s.recursos
    .map((slug) => RECURSOS.find((r) => r.slug === slug))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ slug: r.slug, titulo: r.titulo, resumo: r.resumo, icone: r.icone, emBreve: r.status === "em-breve" }));

  return (
    <PlataformaShell>
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <JsonLdPagina nome={s.seoTitulo} descricao={s.seoDescricao} perguntas={s.faq} />
        <ServicoHero etiqueta={s.titulo} titulo={s.heroTitulo} texto={s.heroTexto} imagem={s.imagem} />
        <Secao titulo="O que costuma pesar no dia a dia" tom="linha">
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3 md:gap-6">
            {s.dores.map((d) => (
              <li key={d.titulo} className="min-w-0 rounded-2xl border bg-white p-6" style={{ borderColor: "var(--p-line, #e4dccd)" }}>
                <h3 className="text-xl font-bold leading-snug">{d.titulo}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{d.texto}</p>
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="O que muda com a sua loja">
          <ListaGanhos itens={s.ganhos} />
        </Secao>
        <Relacionados titulo="Recursos que resolvem isso" itens={recursos} tom="linha" />
        <Passos itens={s.passos} />
        <Faq itens={s.faq} />
        <CtaFinal />
      </main>
    </PlataformaShell>
  );
}
