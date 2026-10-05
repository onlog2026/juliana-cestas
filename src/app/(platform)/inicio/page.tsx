import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Banknote, Check, CreditCard, MessageSquareHeart, Plus, QrCode, Smartphone, Store,
  Truck, Palette, TriangleAlert, CalendarClock,
} from "lucide-react";
import { PlataformaShell } from "@/components/platform/site/shell";
import { Icone } from "@/components/platform/site/icones";
import { RECURSOS } from "@/modules/platform/recursos";
import { SOLUCOES } from "@/modules/platform/solucoes";
import { MODELOS } from "@/modules/platform/modelos-catalog";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent, type PublicPlan } from "@/modules/platform/landing-service";
import { getPublicPlansPage } from "@/modules/platform/plans-public";
import { Celular, Notebook, achaTela } from "./aparelhos";

/**
 * Home da plataforma (/inicio). 13 seções:
 *  1 Herói · 2 Fatos verificáveis · 3 O problema · 4 Como funciona · 5 Modelos · 6 Recursos ·
 *  7 Entrega e carrinho · 8 Pagamentos · 9 Loja que vira app · 10 Soluções · 11 Planos · 12 Perguntas · 13 Fecho.
 *
 * Nada de número inventado: contagens vêm do catálogo; preços e dias de teste vêm do banco
 * (se a leitura falhar, a página diz isso em vez de chutar). Recurso que não existe aparece como "Em breve".
 * `force-dynamic`: os planos mudam no painel e uma leitura falha no build não pode derrubar o deploy.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let marca = PLATFORM_DEFAULTS.branding;
  try {
    marca = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[inicio] metadados caíram no padrão:", e);
  }
  return {
    title: `${marca.wordmark} — loja virtual para cestas e presentes`,
    description:
      "Crie a loja virtual das suas cestas e presentes: escolha um modelo, receba pedidos com data e horário de entrega e cobre por PIX, cartão ou boleto.",
    icons: marca.faviconUrl ? { icon: marca.faviconUrl } : undefined,
    alternates: { canonical: "/" },
  };
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Modelos da vitrine da home (ordem pensada para variar o visual); o que não existir no catálogo é ignorado. */
const DESTAQUES = ["boutique", "rustico", "festa", "galeria", "noir", "promo", "vibrante", "aconchego", "panorama", "stories"];

export default async function InicioPage() {
  let marca = PLATFORM_DEFAULTS.branding;
  try {
    marca = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[inicio] marca caiu no padrão:", e);
  }
  const { plans, trialDays } = await getPublicPlansPage();
  const nome = marca.wordmark;

  const totalVisuais = MODELOS.reduce((soma, m) => soma + m.telas.length, 0);
  const temTeste = trialDays !== null && trialDays > 0;
  const textoTeste = temTeste ? `${trialDays} ${trialDays === 1 ? "dia" : "dias"} de teste, sem cartão para começar.` : "Comece sem cartão e escolha o plano depois.";

  const hero = achaTela("boutique", "premium");
  const heroCel = achaTela("festa", "aniversario");
  const entregaCel = achaTela("bairro", "verde-whatsapp");
  const appA = achaTela("rustico", "cafe-colonial");
  const appB = achaTela("aconchego", "pessego");
  const vitrine = DESTAQUES.map((k) => MODELOS.find((m) => m.key === k)).filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <PlataformaShell>
      <main>
        {/* 1 · Herói */}
        <section className="plt-hero" aria-labelledby="h-hero">
          <div className="plt-wrap plt-hero-grade">
            <div>
              <p className="plt-hero-selo"><i aria-hidden="true" />Loja virtual para quem vende cestas e presentes</p>
              <h1 id="h-hero">Saia do Instagram e abra a <em>sua loja</em> de cestas e presentes.</h1>
              <p className="plt-hero-texto">
                Escolha um visual, cadastre suas cestas e receba pedidos com data e horário de entrega marcados.
                O cliente paga por PIX, cartão ou boleto, direto na sua conta.
              </p>
              <div className="plt-hero-botoes">
                <Link href="/cadastro" className="plt-btn plt-btn-ambar">Criar loja grátis <ArrowRight aria-hidden="true" /></Link>
                <Link href="/modelos" className="plt-btn plt-btn-contorno-claro">Ver modelos de loja</Link>
              </div>
              <p className="plt-hero-nota">{textoTeste}</p>
            </div>
            <div className="plt-hero-cena" aria-hidden="false">
              <div className="plt-hero-notebook">
                <Notebook src={hero.desktop} alt={`Loja de cestas no computador, modelo ${hero.modelo}`} prioridade />
              </div>
              <div className="plt-hero-celular">
                <Celular src={heroCel.celular} alt={`Loja de cestas no celular, modelo ${heroCel.modelo}`} />
              </div>
              <span className="plt-chip plt-chip-b"><span><QrCode aria-hidden="true" /></span>Pagamento por PIX</span>
              <span className="plt-chip plt-chip-a"><span><MessageSquareHeart aria-hidden="true" /></span>Cartão de mensagem</span>
            </div>
          </div>
        </section>

        {/* 2 · Fatos verificáveis */}
        <section className="plt-fatos" aria-label="Em resumo">
          <div className="plt-wrap">
            <ul>
              <li className="plt-fato"><Palette aria-hidden="true" /><div><strong>{MODELOS.length} modelos de loja</strong><span>{totalVisuais} visuais, com troca livre</span></div></li>
              <li className="plt-fato"><CreditCard aria-hidden="true" /><div><strong>PIX, cartão e boleto</strong><span>Na conta da sua própria loja</span></div></li>
              <li className="plt-fato"><CalendarClock aria-hidden="true" /><div><strong>Data e horário</strong><span>Entrega marcada pelo cliente</span></div></li>
              <li className="plt-fato"><Smartphone aria-hidden="true" /><div><strong>Vira app no celular</strong><span>Sua loja na tela inicial</span></div></li>
            </ul>
          </div>
        </section>

        {/* 3 · O problema */}
        <section className="plt-secao" aria-labelledby="h-problema">
          <div className="plt-wrap plt-problema">
            <div className="plt-revela">
              <p className="plt-olho">O problema</p>
              <h2 id="h-problema" className="plt-titulo">Vender pelo Instagram funciona. Até o pedido virar bagunça.</h2>
              <p className="plt-sub">
                Cada venda vira uma conversa longa, e é na conversa que o pedido se perde. Uma loja própria resolve isso sem tirar o seu jeito de vender.
              </p>
            </div>
            <ol className="plt-dores plt-revela">
              <li className="plt-dor"><span className="plt-dor-n" aria-hidden="true">1</span><div><h3>Endereço, data e recado em mensagens soltas</h3><p>É preciso perguntar tudo a cada cliente, e uma informação esquecida vira entrega errada.</p></div></li>
              <li className="plt-dor"><span className="plt-dor-n" aria-hidden="true">2</span><div><h3>Frete e disponibilidade no improviso</h3><p>Sem tabela, cada orçamento é uma conta nova e o cliente espera pela resposta.</p></div></li>
              <li className="plt-dor"><span className="plt-dor-n" aria-hidden="true">3</span><div><h3>A cesta some no meio das postagens</h3><p>Quem quer comprar de novo não encontra o que viu. Numa loja, tudo fica num endereço só.</p></div></li>
            </ol>
          </div>
        </section>

        {/* 4 · Como funciona */}
        <section className="plt-secao plt-secao-papel2" aria-labelledby="h-passos">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-cabeca-centro plt-revela">
              <p className="plt-olho">Como funciona</p>
              <h2 id="h-passos" className="plt-titulo">Do cadastro ao primeiro pedido, em três passos</h2>
            </div>
            <ol className="plt-passos">
              <li className="plt-passo plt-revela"><h3>Crie a loja e escolha o modelo</h3><p>Você se cadastra, dá nome à loja e escolhe entre {MODELOS.length} modelos. Pode trocar depois, sem perder cestas nem pedidos.</p></li>
              <li className="plt-passo plt-revela"><h3>Cadastre suas cestas</h3><p>Fotos, preços e o que vai em cada cesta. Defina também a entrega: datas, horários e frete por CEP.</p></li>
              <li className="plt-passo plt-revela"><h3>Divulgue o link e receba pedidos</h3><p>Coloque o endereço da loja no Instagram e no WhatsApp. O pedido chega completo, com data, endereço e cartão de mensagem.</p></li>
            </ol>
          </div>
        </section>

        {/* 5 · Modelos */}
        <section className="plt-secao" aria-labelledby="h-modelos">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-revela">
              <p className="plt-olho">Modelos de loja</p>
              <h2 id="h-modelos" className="plt-titulo">Um visual para cada jeito de vender</h2>
              <p className="plt-sub">São {MODELOS.length} modelos, cada um com variações de cor. Estas são capturas de lojas de exemplo, de verdade.</p>
            </div>
            <ul className="plt-trilho" aria-label="Alguns modelos de loja">
              {vitrine.map((m) => (
                <li key={m.key} style={{ display: "contents" }}>
                  <Link href={`/modelos/${m.key}`} className="plt-modelo">
                    <div className="plt-modelo-moldura">
                      <div className="plt-notebook-barra" aria-hidden="true"><i /><i /><i /></div>
                      <div className="plt-recorte-d">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.telas[0].desktop} alt={`Modelo ${m.name} no computador`} width={1400} height={875} loading="lazy" decoding="async" />
                      </div>
                    </div>
                    <h3>{m.name}</h3>
                    <p>{m.paraQuem}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="plt-modelos-pe">
              <p>{totalVisuais} visuais no total, com loja de exemplo para cada um.</p>
              <Link href="/modelos" className="plt-seta-link">Ver todos os modelos <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        {/* 6 · Recursos */}
        <section className="plt-secao plt-secao-papel2" aria-labelledby="h-recursos">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-revela">
              <p className="plt-olho">Recursos</p>
              <h2 id="h-recursos" className="plt-titulo">Tudo o que uma loja de cestas precisa</h2>
              <p className="plt-sub">Pensado para quem entrega presente: data marcada, cartão de mensagem, vários itens no mesmo carrinho.</p>
            </div>
            <ul className="plt-recursos">
              {RECURSOS.map((r) => (
                <li key={r.slug}>
                  <Link href={`/recursos/${r.slug}`} className="plt-recurso plt-revela">
                    <span className="plt-recurso-icone"><Icone nome={r.icone} /></span>
                    <div>
                      <h3>{r.titulo}{r.status === "em-breve" ? <span className="plt-selo-breve">Em breve</span> : null}</h3>
                      <p>{r.resumo}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 20 }}><Link href="/recursos" className="plt-seta-link">Ver todos os recursos <ArrowRight aria-hidden="true" /></Link></p>
          </div>
        </section>

        {/* 7 · Entrega e carrinho */}
        <section className="plt-secao" aria-labelledby="h-entrega">
          <div className="plt-wrap plt-duas">
            <div className="plt-revela">
              <p className="plt-olho">Carrinho e entrega</p>
              <h2 id="h-entrega" className="plt-titulo">Presente tem dia e hora para chegar</h2>
              <p className="plt-sub">O cliente monta o pedido sozinho e já informa quando e onde a cesta deve ser entregue.</p>
              <ul className="plt-lista">
                <li><Check aria-hidden="true" /><div><strong>Várias cestas no mesmo carrinho</strong><span>Um pedido só, mesmo com presentes para pessoas diferentes.</span></div></li>
                <li><Truck aria-hidden="true" /><div><strong>Data, horário e frete por CEP</strong><span>O frete é calculado pelo CEP de entrega do cliente.</span></div></li>
                <li><MessageSquareHeart aria-hidden="true" /><div><strong>Cartão de mensagem</strong><span>O recado de quem presenteia vai junto do pedido.</span></div></li>
              </ul>
              <p style={{ marginTop: 20 }}><Link href="/recursos" className="plt-seta-link">Conhecer os recursos de entrega <ArrowRight aria-hidden="true" /></Link></p>
            </div>
            <div className="plt-palco plt-revela">
              <Celular src={entregaCel.celular} alt={`Loja de cestas com entrega por região, modelo ${entregaCel.modelo}, no celular`} />
            </div>
          </div>
        </section>

        {/* 8 · Pagamentos */}
        <section className="plt-secao plt-secao-tinta" aria-labelledby="h-pagamentos">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-cabeca-centro plt-revela" style={{ marginBottom: 0 }}>
              <p className="plt-olho">Pagamentos</p>
              <h2 id="h-pagamentos" className="plt-titulo">Receba na sua conta, do jeito que o cliente prefere</h2>
              <p className="plt-sub">
                O pagamento passa pelo Asaas, na conta da sua própria loja. Você escolhe como o cliente pode pagar.
              </p>
              <div className="plt-meios" style={{ justifyContent: "center" }}>
                <span className="plt-meio"><QrCode aria-hidden="true" />PIX</span>
                <span className="plt-meio"><CreditCard aria-hidden="true" />Cartão de crédito</span>
                <span className="plt-meio"><Banknote aria-hidden="true" />Boleto</span>
              </div>
            </div>
          </div>
        </section>

        {/* 9 · A loja vira app */}
        <section className="plt-secao" aria-labelledby="h-app">
          <div className="plt-wrap plt-duas plt-duas-inverso">
            <div className="plt-revela">
              <p className="plt-olho">No celular do cliente</p>
              <h2 id="h-app" className="plt-titulo">Sua loja vira aplicativo</h2>
              <p className="plt-sub">A maioria das suas clientes vai comprar pelo celular. Por isso a loja funciona bem na tela pequena e pode ser instalada na tela inicial, como um app.</p>
              <ul className="plt-lista">
                <li><Smartphone aria-hidden="true" /><div><strong>Abre com um toque</strong><span>A cliente guarda a loja na tela inicial e volta quando quiser presentear.</span></div></li>
                <li><Store aria-hidden="true" /><div><strong>Mesma loja, em qualquer tela</strong><span>O visual que você escolheu aparece no celular, no tablet e no computador.</span></div></li>
              </ul>
            </div>
            <div className="plt-palco plt-palco-par plt-revela">
              <Celular src={appA.celular} alt={`Loja no celular, modelo ${appA.modelo}`} />
              <Celular src={appB.celular} alt={`Loja no celular, modelo ${appB.modelo}`} />
            </div>
          </div>
        </section>

        {/* 10 · Soluções */}
        <section className="plt-secao plt-secao-papel2" aria-labelledby="h-solucoes">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-revela">
              <p className="plt-olho">Para o seu caso</p>
              <h2 id="h-solucoes" className="plt-titulo">Em qual situação você está?</h2>
              <p className="plt-sub">Cada negócio de presentes começa de um ponto. Veja como a plataforma ajuda no seu.</p>
            </div>
            <ul className="plt-solucoes">
              {SOLUCOES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/solucoes/${s.slug}`} className="plt-solucao plt-revela">
                    <div><h3>{s.titulo}</h3><p>{s.resumo}</p></div>
                    <span>Ver como funciona <ArrowRight aria-hidden="true" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 11 · Planos (preço sempre do banco) */}
        <section className="plt-secao" aria-labelledby="h-planos">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-cabeca-centro plt-revela">
              <p className="plt-olho">Preços</p>
              <h2 id="h-planos" className="plt-titulo">Planos para cada tamanho de loja</h2>
              <p className="plt-sub">{temTeste ? `Você começa com ${trialDays} ${trialDays === 1 ? "dia" : "dias"} de teste, sem cartão. O plano só é escolhido depois.` : "Você monta a loja e escolhe o plano dentro do painel. Nenhuma cobrança acontece no cadastro."}</p>
            </div>
            <Planos plans={plans} />
            <p className="plt-planos-nota"><Link href="/planos" className="plt-seta-link">Comparar os planos em detalhe <ArrowRight aria-hidden="true" /></Link></p>
          </div>
        </section>

        {/* 12 · Perguntas */}
        <section className="plt-secao plt-secao-papel2" aria-labelledby="h-faq">
          <div className="plt-wrap">
            <div className="plt-cabeca plt-cabeca-centro plt-revela">
              <p className="plt-olho">Perguntas frequentes</p>
              <h2 id="h-faq" className="plt-titulo">O que quase todo mundo pergunta</h2>
            </div>
            <div className="plt-faq">
              <Pergunta q="Preciso saber programar ou ter um site?">Não. O painel é em português e você cadastra as cestas como cadastraria um produto em qualquer loja. O endereço da loja já nasce pronto.</Pergunta>
              <Pergunta q="Posso trocar de modelo depois?">Pode, quando quiser. As cestas e os pedidos continuam onde estão, só o visual muda.</Pergunta>
              <Pergunta q="Como eu recebo o dinheiro dos pedidos?">Por PIX, cartão ou boleto, pelo Asaas, na conta da sua própria loja.</Pergunta>
              <Pergunta q="Como funciona o teste?">{temTeste ? `Você usa a plataforma por ${trialDays} ${trialDays === 1 ? "dia" : "dias"} sem informar cartão. Só depois escolhe o plano.` : "Você cria a loja sem informar cartão e escolhe o plano depois, dentro do painel."}</Pergunta>
              <Pergunta q="Posso vender para empresas?">Pode. A loja tem opção de pedido de orçamento para cestas corporativas, além da venda normal.</Pergunta>
              <Pergunta q="Já integra com o Bling?">Ainda não. A integração com o ERP Bling (pedidos, estoque, produtos e nota fiscal) está marcada como &ldquo;Em breve&rdquo; e só será anunciada quando funcionar.</Pergunta>
            </div>
          </div>
        </section>

        {/* 13 · Fecho */}
        <section className="plt-fecho" aria-labelledby="h-fecho">
          <div className="plt-wrap plt-revela">
            <h2 id="h-fecho">Sua loja de presentes pode abrir hoje.</h2>
            <p>Crie a loja no {nome}, escolha o modelo e cadastre a primeira cesta. {textoTeste}</p>
            <div className="plt-hero-botoes">
              <Link href="/cadastro" className="plt-btn plt-btn-ambar">Criar loja grátis <ArrowRight aria-hidden="true" /></Link>
              <Link href="/planos" className="plt-btn plt-btn-contorno-claro">Ver preços</Link>
            </div>
          </div>
        </section>
      </main>
    </PlataformaShell>
  );
}

function Pergunta({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>{q}<Plus aria-hidden="true" /></summary>
      <p>{children}</p>
    </details>
  );
}

/** Planos: três estados honestos (com planos / nenhum publicado / falha de leitura). Preço só do banco, em centavos. */
function Planos({ plans }: { plans: PublicPlan[] | null }) {
  if (plans === null) {
    return (
      <div className="plt-aviso" role="status">
        <p><TriangleAlert aria-hidden="true" style={{ display: "inline", width: 18, height: 18, marginRight: 8, verticalAlign: "-3px" }} /><strong>Não conseguimos carregar os planos agora.</strong></p>
        <p>É uma falha temporária nossa. Atualize a página em instantes ou veja a página de <Link href="/planos" className="plt-seta-link" style={{ minHeight: 0 }}>preços</Link>.</p>
      </div>
    );
  }
  if (plans.length === 0) {
    return (
      <div className="plt-aviso">
        <p><strong>Os planos ainda não foram publicados.</strong></p>
        <p>Preferimos não mostrar valor nenhum a mostrar um valor que não é o real. Você já pode criar a loja e testar.</p>
      </div>
    );
  }
  return (
    <div className="plt-planos">
      {plans.map((p) => (
        <article key={p.slug} className={p.isAnchor ? "plt-plano plt-plano-destaque plt-revela" : "plt-plano plt-revela"}>
          <div className="plt-plano-topo">
            <h3>{p.name}</h3>
            {p.badge ? <span className="plt-plano-selo">{p.badge}</span> : null}
          </div>
          {p.description ? <p className="plt-plano-desc">{p.description}</p> : null}
          <p className="plt-plano-preco">
            <strong>{p.monthlyCents === 0 ? "Grátis" : REAIS.format(p.monthlyCents / 100)}</strong>
            {p.monthlyCents > 0 ? <span>/mês</span> : null}
          </p>
          <ul>
            {p.included.slice(0, 6).map((f) => (
              <li key={f.slug}><Check aria-hidden="true" /><span>{f.name}{f.limitDisplay ? ` — ${f.limitDisplay}` : ""}</span></li>
            ))}
          </ul>
          <Link href={`/cadastro?plano=${encodeURIComponent(p.slug)}`} className={p.isAnchor ? "plt-btn plt-btn-ambar plt-btn-bloco" : "plt-btn plt-btn-contorno plt-btn-bloco"}>
            Começar com o {p.name}
          </Link>
        </article>
      ))}
    </div>
  );
}
