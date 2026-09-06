import Link from "next/link";
import { Info, TriangleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listTenants } from "@/modules/platform/service";
import {
  listSubscriptionPlans,
  buildResumoFinanceiro,
  type ResumoFinanceiro,
} from "@/modules/platform/finance-service";
import { formatCents } from "@/lib/money";
import { MrrCards, type CardDeMetrica } from "@/components/platform/mrr-cards";
import { SubscriptionDistribution } from "@/components/platform/subscription-distribution";

export const dynamic = "force-dynamic";

export default async function SuperFinanceiroPage() {
  // O layout já protege a rota, mas esta tela mostra o faturamento inteiro da
  // plataforma: confirma de novo por conta própria.
  await requireSuperAdmin();

  // Se a leitura falhar, a tela DIZ que falhou — nunca vira "R$ 0,00", que
  // seria indistinguível de "nenhuma loja pagando".
  let resumo: ResumoFinanceiro | null = null;
  let mensagemDeErro: string | null = null;

  try {
    const [lojas, planos] = await Promise.all([listTenants(), listSubscriptionPlans()]);
    resumo = buildResumoFinanceiro(lojas, planos);
  } catch (e) {
    mensagemDeErro = e instanceof Error ? e.message : "Não foi possível carregar os dados financeiros.";
  }

  const erro = mensagemDeErro;
  const dados = resumo;

  const cards: CardDeMetrica[] = dados
    ? [
        {
          chave: "total",
          icone: "Store",
          titulo: "Total de lojas",
          valor: String(dados.totalLojas),
          legenda: "Todas as lojas da plataforma",
          href: "/super/lojas",
        },
        {
          chave: "mrr",
          icone: "Wallet",
          titulo: "MRR estimado",
          valor: formatCents(dados.mrrCents),
          legenda: `${dados.lojasAtivas} ${dados.lojasAtivas === 1 ? "loja com assinatura ativa" : "lojas com assinatura ativa"} · ver quais`,
          href: "/super/lojas?status=active",
        },
        {
          chave: "trialing",
          icone: "Clock",
          titulo: "Em teste",
          valor: String(dados.emTeste),
          legenda: "Ainda não pagaram nada",
          href: "/super/lojas?status=trialing",
        },
        {
          chave: "overdue",
          icone: "TriangleAlert",
          titulo: "Inadimplentes",
          valor: String(dados.inadimplentes),
          legenda: "Pagamento em atraso",
          href: "/super/lojas?status=overdue",
          destaque: dados.inadimplentes > 0 ? "alerta" : undefined,
        },
        {
          chave: "suspensas",
          icone: "PauseCircle",
          titulo: "Suspensas",
          valor: String(dados.suspensas),
          legenda: "Vitrine fora do ar para os clientes",
          href: "/super/lojas?status=suspensa",
          destaque: dados.suspensas > 0 ? "alerta" : undefined,
        },
        {
          chave: "canceladas",
          icone: "CircleSlash",
          titulo: "Canceladas (churn)",
          valor: String(dados.canceladas),
          legenda: "Assinaturas encerradas",
          href: "/super/lojas?status=canceled",
        },
      ]
    : [];

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-foreground">Financeiro da plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que as lojas pagam para você. Isto é diferente do financeiro de cada loja, que mostra o que os
          clientes dela pagam para ela.
        </p>
      </div>

      {erro ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar o financeiro
          </div>
          <p className="mt-2 text-sm text-foreground">{erro}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Os números não aparecem porque o banco de dados não respondeu — não é porque não existe nenhuma
            loja pagando. Recarregue a página; se continuar assim, o banco está fora do ar.
          </p>
        </div>
      ) : null}

      {dados ? (
        <>
          {/* A tarja honesta. Ela vem ANTES dos números de propósito: quem lê o
              valor precisa saber, antes de tomar decisão, que ele é projeção. */}
          <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Info className="size-4" /> Estes valores são uma ESTIMATIVA, não o dinheiro que entrou
            </div>
            <p className="mt-2 text-sm text-amber-900">
              O MRR abaixo é calculado somando o preço cadastrado do plano de cada loja que está marcada como
              “assinatura ativa”. É o valor que <strong>deveria</strong> entrar por mês se todas elas pagarem
              em dia. Não é o valor que a plataforma <strong>realmente recebeu</strong>.
            </p>
            <p className="mt-2 text-sm text-amber-900">
              Enquanto a plataforma não tiver uma tabela de faturas pagas (registro de cada cobrança
              efetivamente recebida no Asaas), não existe nenhum lugar no sistema que saiba o valor real. Não
              use este número para fechar caixa nem para declarar imposto.
            </p>
          </div>

          <div className="mt-4">
            <MrrCards cards={cards} />
          </div>

          <div className="mt-4 rounded-card border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">De onde vem o MRR estimado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Uma linha por plano, contando só as lojas com assinatura ativa. O preço vem sempre da tabela de
              planos do banco de dados, nunca de um valor digitado em tela.
            </p>

            {dados.porPlano.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhuma loja com assinatura ativa hoje, então o MRR estimado é R$ 0,00. Isso é diferente de
                “não consegui ler os dados” — a leitura funcionou e o resultado foi zero mesmo.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                      <th className="py-2 pr-3 font-medium">Plano</th>
                      <th className="py-2 pr-3 font-medium">Preço por mês</th>
                      <th className="py-2 pr-3 font-medium">Lojas ativas</th>
                      <th className="py-2 font-medium">Soma por mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dados.porPlano.map((linha) => (
                      <tr key={linha.slug}>
                        <td className="py-2.5 pr-3 text-foreground">
                          {linha.nome}
                          {linha.precoMensalCents === 0 ? (
                            <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                              cortesia
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {formatCents(linha.precoMensalCents)}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{linha.lojasAtivas}</td>
                        <td className="py-2.5 font-medium text-foreground">{formatCents(linha.mrrCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td className="py-2.5 pr-3 font-semibold text-foreground" colSpan={3}>
                        MRR estimado (soma de tudo acima)
                      </td>
                      <td className="py-2.5 font-semibold text-foreground">{formatCents(dados.mrrCents)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3 text-xs text-muted-foreground" colSpan={3}>
                        Projeção para 12 meses, se nada mudar (ARR estimado)
                      </td>
                      <td className="py-1 text-xs text-muted-foreground">
                        {formatCents(dados.arrEstimadoCents)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Lojas de cortesia: contadas, mas somando R$ 0,00. Sem esta caixa,
              o dono veria "5 lojas ativas" e um MRR menor do que esperava, sem
              saber por quê. */}
          {dados.lojasEmCortesia.length > 0 ? (
            <div className="mt-4 rounded-card border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Lojas em plano de cortesia (contam como ativas, mas não somam dinheiro)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Estas lojas têm um plano cadastrado com preço de R$ 0,00 — por exemplo o plano{" "}
                <strong>Fundadora</strong>, da primeira loja da plataforma. Elas aparecem no total de lojas
                ativas e usam o sistema normalmente, mas somam zero no MRR porque não pagam mensalidade. Isso é
                proposital, não é erro de cadastro.
              </p>
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {dados.lojasEmCortesia.map((loja) => (
                  <li key={loja.id} className="py-2">
                    <Link href={`/super/lojas/${loja.id}`} className="text-sm text-primary hover:underline">
                      {loja.nome}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">plano {loja.plano}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Plano desconhecido NUNCA vira zero em silêncio: preço desconhecido
              é "não sei", e "não sei" tem que aparecer na tela. */}
          {dados.lojasComPlanoNaoReconhecido.length > 0 ? (
            <div className="mt-4 rounded-card border border-destructive/40 bg-destructive/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <TriangleAlert className="size-4" /> Lojas com plano não reconhecido (não somam no MRR)
              </div>
              <p className="mt-2 text-sm text-foreground">
                Estas lojas estão com a assinatura marcada como ativa, mas o plano gravado nelas não existe na
                tabela de planos. Como não existe preço cadastrado, o sistema <strong>não sabe</strong> quanto
                elas deveriam pagar — e por isso elas ficam de fora da soma acima, em vez de entrar valendo
                R$ 0,00.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                O que fazer: abra cada loja e escolha um plano que exista, ou cadastre o plano que falta. O MRR
                estimado só fica correto quando esta lista estiver vazia.
              </p>
              <ul className="mt-3 flex flex-col divide-y divide-destructive/20">
                {dados.lojasComPlanoNaoReconhecido.map((loja) => (
                  <li key={loja.id} className="py-2">
                    <Link href={`/super/lojas/${loja.id}`} className="text-sm text-primary hover:underline">
                      {loja.nome}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {loja.plano ? `plano gravado: "${loja.plano}"` : "nenhum plano gravado"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 rounded-card border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Distribuição de assinaturas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique em uma situação para ver a lista de lojas já filtrada.
            </p>
            <SubscriptionDistribution fatias={dados.distribuicao} />
          </div>
        </>
      ) : null}
    </div>
  );
}
