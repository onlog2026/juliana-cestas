import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlataformaShell } from "@/components/platform/site/shell";
import { RECURSOS, getRecurso } from "@/modules/platform/recursos";
import { ServicoHero } from "@/components/platform/servicos/hero";
import { Problema } from "@/components/platform/servicos/problema";
import { Beneficios } from "@/components/platform/servicos/beneficios";
import { Passos } from "@/components/platform/servicos/passos";
import { Faq } from "@/components/platform/servicos/faq";
import { Relacionados } from "@/components/platform/servicos/relacionados";
import { CtaFinal } from "@/components/platform/servicos/cta";
import { JsonLdPagina } from "@/components/platform/servicos/json-ld";

/** Uma única página dirigida por dados (`src/modules/platform/recursos.ts`), pré-gerada para cada serviço. */
export const dynamicParams = false;

export function generateStaticParams() {
  return RECURSOS.map((r) => ({ servico: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ servico: string }> }): Promise<Metadata> {
  const { servico } = await params;
  const r = getRecurso(servico);
  if (!r) return {};
  return {
    title: { absolute: r.seoTitulo },
    description: r.seoDescricao,
    alternates: { canonical: `/recursos/${r.slug}` },
    openGraph: { title: r.seoTitulo, description: r.seoDescricao, type: "website", locale: "pt_BR", url: `/recursos/${r.slug}` },
  };
}

export default async function RecursoPage({ params }: { params: Promise<{ servico: string }> }) {
  const { servico } = await params;
  const r = getRecurso(servico);
  if (!r) notFound();

  const relacionados = r.relacionados
    .map((s) => RECURSOS.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => ({ slug: x.slug, titulo: x.titulo, resumo: x.resumo, icone: x.icone, emBreve: x.status === "em-breve" }));

  const emBreve = r.status === "em-breve";

  return (
    <PlataformaShell>
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <JsonLdPagina nome={r.seoTitulo} descricao={r.seoDescricao} perguntas={r.faq} />
        <ServicoHero etiqueta={r.titulo} icone={r.icone} titulo={r.heroTitulo} texto={r.heroTexto} imagem={r.imagem} emBreve={emBreve} aviso={r.aviso} />
        <Problema titulo={r.problema.titulo} texto={r.problema.texto} />
        <Beneficios titulo={emBreve ? "O que está planejado e o que já existe" : "O que você ganha"} itens={r.beneficios} />
        <Passos itens={r.passos} />
        <Faq itens={r.faq} />
        <Relacionados itens={relacionados} />
        <CtaFinal
          titulo={emBreve ? "Comece agora com o que já funciona" : undefined}
          texto={emBreve ? "Pedidos, entregas, pagamentos e estoque já estão no painel. Teste a loja por 7 dias grátis." : undefined}
        />
      </main>
    </PlataformaShell>
  );
}
