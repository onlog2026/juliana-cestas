"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Info, Loader2, RotateCcw, X } from "lucide-react";
import { aplicarModelo, desfazerTrocaDeModelo } from "@/modules/storefront/actions";

/**
 * GALERIA DE MODELOS (lado do cliente).
 *
 * Tudo que este componente recebe é texto, número e cor. Nenhuma função e
 * nenhum componente atravessa a fronteira servidor -> cliente: o servidor
 * manda o TIPO da seção como string e é aqui, no cliente, que a string vira
 * desenho. Passar função nessa fronteira derruba a página em produção mesmo
 * passando no `tsc` e no `next build`.
 *
 * Sem `filter: blur()` em elemento `position: fixed` -- a cortina da
 * confirmação é cor sólida com transparência. Blur em elemento preso na tela
 * trava a rolagem no celular; é regra da casa e já custou caro.
 */

export type TemplateCard = {
  key: string;
  name: string;
  description: string;
  indicadoPara: string;
  cores: {
    background: string;
    foreground: string;
    primary: string;
    card: string;
    border: string;
    gold: string;
    radius: string;
  };
  fontes: string;
  cabecalho: string;
  rodape: string;
  paginaDeProduto: string;
  secoes: { type: string; label: string; variante: string }[];
};

type Props = {
  cards: TemplateCard[];
  modeloAtual: string | null;
  podeDesfazer: boolean;
  nomeModeloAnterior: string | null;
};

/* ─────────────────────────── desenho da prévia ─────────────────────────── */

/**
 * A prévia é um DESENHO, não uma foto e não um iframe da loja.
 *
 * Foto envelhece (a loja muda e a foto continua igual, mentindo) e iframe pesa
 * e não funciona antes de a página existir. O desenho é montado a partir das
 * seções de verdade do modelo: se o modelo mudar, a prévia muda junto,
 * sozinha.
 */
function Faixa({ cor, altura, radius }: { cor: string; altura: number; radius: string }) {
  return <div style={{ background: cor, height: altura, borderRadius: radius }} />;
}

function DesenhoDaSecao({ tipo, cores }: { tipo: string; cores: TemplateCard["cores"] }) {
  const { primary, foreground, card, border, gold, radius } = cores;
  const linha = (largura: string, cor = border) => (
    <div style={{ background: cor, height: 4, width: largura, borderRadius: 999 }} />
  );

  switch (tipo) {
    case "hero":
      return <Faixa cor={primary} altura={44} radius={radius} />;
    case "promo-bar":
      return <Faixa cor={primary} altura={8} radius={999 + "px"} />;
    case "category-grid":
      return (
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1" style={{ background: card, height: 14, borderRadius: 999, border: `1px solid ${border}` }} />
          ))}
        </div>
      );
    case "product-grid":
      return (
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ background: card, height: 18, borderRadius: radius, border: `1px solid ${border}` }} />
          ))}
        </div>
      );
    case "signature":
    case "collection-spotlight":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <div style={{ background: card, height: 26, borderRadius: radius, border: `1px solid ${border}` }} />
          <div className="flex flex-col justify-center gap-1.5 px-1">
            {linha("90%")}
            {linha("70%")}
          </div>
        </div>
      );
    case "benefits":
      return (
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-1">
              <div style={{ background: gold, width: 8, height: 8, borderRadius: 999 }} />
              {linha("70%")}
            </div>
          ))}
        </div>
      );
    case "faq":
      return (
        <div className="flex flex-col gap-1.5">
          {linha("100%")}
          {linha("100%")}
          {linha("60%")}
        </div>
      );
    case "cta-whatsapp":
      return <Faixa cor={primary} altura={20} radius={radius} />;
    case "rich-text":
      return (
        <div className="flex flex-col gap-1.5">
          {linha("55%", foreground)}
          {linha("100%")}
          {linha("85%")}
        </div>
      );
    case "testimonials":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ background: card, height: 22, borderRadius: radius, border: `1px solid ${border}` }} />
          ))}
        </div>
      );
    case "gallery":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          <div style={{ background: card, height: 26, borderRadius: radius, border: `1px solid ${border}` }} />
          <div style={{ background: card, height: 18, borderRadius: radius, border: `1px solid ${border}` }} />
          <div style={{ background: card, height: 22, borderRadius: radius, border: `1px solid ${border}` }} />
        </div>
      );
    case "steps":
      return (
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-1">
              <div style={{ background: primary, width: 10, height: 10, borderRadius: 999 }} />
              {linha("80%")}
            </div>
          ))}
        </div>
      );
    case "newsletter":
      return <Faixa cor={gold} altura={14} radius={radius} />;
    default:
      return <Faixa cor={border} altura={12} radius={radius} />;
  }
}

function Previa({ card }: { card: TemplateCard }) {
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{ background: card.cores.background, minHeight: 240 }}
      aria-hidden="true"
    >
      {card.secoes.map((secao, indice) => (
        <DesenhoDaSecao key={`${secao.type}-${indice}`} tipo={secao.type} cores={card.cores} />
      ))}
    </div>
  );
}

/* ────────────────────────────── a galeria ──────────────────────────────── */

export function TemplateGallery({ cards, modeloAtual, podeDesfazer, nomeModeloAnterior }: Props) {
  const [confirmando, setConfirmando] = useState<TemplateCard | null>(null);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function aplicar(card: TemplateCard) {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await aplicarModelo(card.key);
      if (!resultado.ok) setErro(resultado.error);
      else setSucesso(resultado.mensagem);
      setConfirmando(null);
    });
  }

  function desfazer() {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await desfazerTrocaDeModelo();
      if (!resultado.ok) setErro(resultado.error);
      else setSucesso(resultado.mensagem);
    });
  }

  return (
    <div>
      {/* O aviso mais importante desta tela: hoje escolher o modelo GRAVA a
          escolha, mas o site publicado ainda não muda. Sem esta frase, a
          lojista aplica o modelo, abre o site, vê tudo igual e conclui que o
          painel está quebrado. */}
      <div className="flex items-start gap-3 rounded-card border border-border bg-secondary/50 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="text-sm text-foreground">
          <p className="font-semibold">Em preparação</p>
          <p className="mt-1 text-muted-foreground">
            Escolher um modelo já grava a sua escolha e monta as páginas no painel, mas o site que está no
            ar ainda continua exatamente como está. A virada será feita com você, comparando as duas
            versões lado a lado antes. Nada no seu site muda agora.
          </p>
        </div>
      </div>

      {erro ? (
        <p className="mt-4 flex items-start gap-2 rounded-card border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p className="mt-4 flex items-start gap-2 rounded-card border border-[var(--jc-success)]/40 bg-[var(--jc-success)]/10 p-3 text-sm text-[var(--jc-success)]">
          <Check className="mt-0.5 size-4 shrink-0" />
          {sucesso}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const atual = card.key === modeloAtual;
          return (
            <section
              key={card.key}
              className="flex flex-col overflow-hidden rounded-card border border-border bg-card"
            >
              <div className="border-b border-border">
                <Previa card={card} />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg text-foreground">{card.name}</h2>
                  {atual ? (
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      Em uso
                    </span>
                  ) : null}
                </div>

                <p className="mt-1.5 text-sm text-muted-foreground">{card.description}</p>
                <p className="mt-2 text-sm text-foreground/80">
                  <span className="font-medium">Indicado para:</span> {card.indicadoPara}
                </p>

                <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-foreground">Cabeçalho: </dt>
                    <dd className="inline">{card.cabecalho}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Rodapé: </dt>
                    <dd className="inline">{card.rodape}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Página de produto: </dt>
                    <dd className="inline">{card.paginaDeProduto}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Letras: </dt>
                    <dd className="inline">{card.fontes}</dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs font-medium text-foreground">
                  Seções da página inicial, na ordem:
                </p>
                <ol className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {card.secoes.map((secao, indice) => (
                    <li key={`${secao.type}-${indice}`}>
                      {indice + 1}. {secao.label} — {secao.variante}
                    </li>
                  ))}
                </ol>

                <div className="mt-5 pt-1">
                  <button
                    type="button"
                    disabled={pendente || atual}
                    onClick={() => setConfirmando(card)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {atual ? "Este é o seu modelo" : "Usar este modelo"}
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {podeDesfazer ? (
        <div className="mt-6 rounded-card border border-border bg-card p-5">
          <h2 className="font-display text-lg text-foreground">Desfazer a última troca</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {nomeModeloAnterior
              ? `Volta para o modelo "${nomeModeloAnterior}", exatamente como estava antes da troca.`
              : "Volta as páginas para como estavam antes da última troca de modelo."}
          </p>
          <button
            type="button"
            disabled={pendente}
            onClick={desfazer}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {pendente ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Desfazer
          </button>
        </div>
      ) : null}

      {confirmando ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.5)] p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-modelo-titulo"
        >
          <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-card bg-card p-5 sm:max-w-lg sm:rounded-card sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirmar-modelo-titulo" className="font-display text-xl text-foreground">
                Usar o modelo &ldquo;{confirmando.name}&rdquo;?
              </h2>
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                aria-label="Fechar"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 rounded-card border border-border bg-secondary/40 p-4">
              <p className="text-sm font-semibold text-foreground">O que muda</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>As seções da sua página inicial e a ordem delas.</li>
                <li>As cores e as letras do site.</li>
                <li>O cabeçalho, o rodapé e o formato da página de produto.</li>
              </ul>
            </div>

            <div className="mt-3 rounded-card border border-[var(--jc-success)]/40 bg-[var(--jc-success)]/10 p-4">
              <p className="text-sm font-semibold text-[var(--jc-success)]">O que NÃO muda</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                <li>Seus produtos, com fotos, preços e descrições.</li>
                <li>Seus pedidos, seus clientes e o que já foi vendido.</li>
                <li>Seus banners, seus cupons e suas regras de entrega.</li>
                <li>Os textos que você escreveu em CMS &gt; Textos do site.</li>
              </ul>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Guardamos como estava antes: se você não gostar, é só clicar em &ldquo;Desfazer&rdquo; nesta
              mesma página.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={pendente}
                onClick={() => aplicar(confirmando)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {pendente ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Sim, usar este modelo
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={() => setConfirmando(null)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
