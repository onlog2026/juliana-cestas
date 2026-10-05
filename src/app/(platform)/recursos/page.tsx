import type { Metadata } from "next";
import { PlataformaShell } from "@/components/platform/site/shell";
import { RECURSOS } from "@/modules/platform/recursos";
import { Secao } from "@/components/platform/servicos/secao";
import { Relacionados } from "@/components/platform/servicos/relacionados";
import { CtaFinal } from "@/components/platform/servicos/cta";

const TITULO = "Recursos da loja: entrega, pagamento, cartão e mais";
const DESCRICAO =
  "Veja tudo o que a loja faz: carrinho com várias cestas, entrega com data e horário, PIX, cartão de mensagem, avaliações, estoque e e-mails.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/recursos" },
  openGraph: { title: TITULO, description: DESCRICAO, type: "website", locale: "pt_BR", url: "/recursos" },
};

export default function RecursosIndexPage() {
  const itens = (status: "disponivel" | "em-breve") =>
    RECURSOS.filter((r) => r.status === status).map((r) => ({
      slug: r.slug,
      titulo: r.titulo,
      resumo: r.resumo,
      icone: r.icone,
      emBreve: r.status === "em-breve",
    }));

  return (
    <PlataformaShell>
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <section className="px-4 pb-6 pt-10 sm:px-6 md:pt-16" style={{ background: "var(--p-paper, #faf6ee)", color: "var(--p-ink, #14110d)" }}>
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="max-w-3xl text-balance text-[clamp(2rem,6.2vw,3.5rem)] font-bold leading-[1.05] tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
              Tudo o que a sua loja de cestas precisa para vender
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>
              Cada serviço abaixo já funciona na plataforma. Os que ainda estão sendo preparados aparecem separados, marcados como em breve.
            </p>
          </div>
        </section>
        <Relacionados titulo="Disponíveis hoje" itens={itens("disponivel")} tom="papel" />
        <Relacionados titulo="Em breve" subtitulo="Ainda não estão disponíveis. Não prometemos data." itens={itens("em-breve")} />
        <Secao titulo="Quer ver como fica na prática?" tom="papel">
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>
            Crie a loja grátis e teste por 7 dias. Você escolhe entre 51 modelos e cadastra as suas cestas.
          </p>
        </Secao>
        <CtaFinal />
      </main>
    </PlataformaShell>
  );
}
