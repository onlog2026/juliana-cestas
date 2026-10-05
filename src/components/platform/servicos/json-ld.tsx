/** JSON-LD simples (WebPage + FAQPage). Só entra o que está visível na página; `<` é escapado. */
export function JsonLdPagina({
  nome,
  descricao,
  perguntas,
}: {
  nome: string;
  descricao: string;
  perguntas: Array<{ pergunta: string; resposta: string }>;
}) {
  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: nome, description: descricao, inLanguage: "pt-BR" },
      {
        "@type": "FAQPage",
        mainEntity: perguntas.map((p) => ({
          "@type": "Question",
          name: p.pergunta,
          acceptedAnswer: { "@type": "Answer", text: p.resposta },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}
