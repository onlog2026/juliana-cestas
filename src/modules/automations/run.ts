import "server-only";
import { createClient } from "@supabase/supabase-js";
import { generatePublicToken, hashToken } from "@/modules/orders/token";
import { sendOrderEmail, getEmailBrand } from "@/modules/notifications/send";
import { cartRecoveryEmail } from "@/modules/notifications/templates/cart-recovery";
import { CARRINHO_ABANDONADO, MAX_CANDIDATE_AGE_DAYS, clampDelayHours } from "@/modules/automations/service";

/**
 * DISPARO EM LOTE DAS AUTOMAÇÕES — chamado pela rotina diária do cron
 * (`src/app/api/cron/daily/route.ts`), UMA vez por dia, para TODAS as lojas.
 *
 * ═══ O QUE "CARRINHO ABANDONADO" QUER DIZER NESTE PROJETO ═══
 * Este site não tem carrinho persistido em banco (é cesta única por
 * checkout). O pedido nasce no banco no instante em que o comprador confirma
 * o checkout (`src/modules/checkout/create-order.ts`), com
 * `status = 'aguardando_pagamento'` e `payment_status = 'pending'` — e só
 * muda para `pago` quando o Asaas confirma o pagamento
 * (`src/modules/payments/service.ts`). Ou seja: aqui, "carrinho abandonado"
 * É o próprio pedido que ficou parado em `aguardando_pagamento`. Não existe
 * uma tabela de carrinho para inventar, e este arquivo não cria nenhuma.
 *
 * ═══ POR QUE 1 VEZ POR DIA (E NÃO NAS X HORAS EXATAS QUE A LOJA ESCOLHEU) ═══
 * A conta da Vercel é Hobby: no máximo uma execução de cron por dia (mesma
 * limitação documentada em `cron/daily/route.ts`). Então "avisar depois de 2
 * horas" na prática quer dizer "o pedido de 2h atrás (ou mais) entra no
 * PRÓXIMO lote da madrugada" — nunca nas 2 horas exatas. Isso é mostrado bem
 * claro na tela `/admin/automacoes`, não só aqui no código. Para avisar de
 * verdade dentro da janela configurada, a plataforma precisaria de um cron
 * mais frequente (Vercel Pro) — decisão de custo do dono, não deste código.
 *
 * ═══ ISOLAMENTO ═══
 * Este código roda para TODAS as lojas de uma vez, com service role — é a
 * única situação do módulo de automações em que uma consulta NÃO nasce
 * filtrada por um `tenantId` já resolvido de fora (não tem como: é ele quem
 * decide, loja por loja, quem tem a regra ligada). Cada loja é processada
 * isoladamente, dentro do próprio try/catch: se uma loja falhar (erro de
 * rede, dado inconsistente, o que for), as outras continuam recebendo o
 * e-mail delas normalmente. Esta função em si NUNCA lança.
 *
 * ═══ IDEMPOTÊNCIA ═══
 * `automation_runs` com `unique (tenant_id, kind, reference_id)` (migração
 * 0037) é a rede de segurança: o mesmo pedido nunca recebe dois e-mails desta
 * regra, mesmo que a rotina rode duas vezes. O código confere antes de gravar
 * (por eficiência — não bater no banco por um dado que já sabe que vai ser
 * recusado), mas quem garante de verdade é o índice único.
 *
 * ═══ TOKEN DO PEDIDO ═══
 * O link do e-mail de confirmação (`order_confirmed`) usa um token cujo
 * TEXTO PURO só existiu naquele e-mail — o banco guarda só o hash
 * (`orders.public_token_hash`), igual ao padrão de `reviews/invite.ts`. Sem
 * gerar um token novo aqui não haveria como montar um link que funcione;
 * por isso este código emite um token novo e sobrescreve o hash salvo antes
 * de mandar o e-mail (o link antigo do e-mail de confirmação para de
 * funcionar a partir daí — aceitável: quem não pagou ainda não teria motivo
 * para voltar a abrir aquele e-mail).
 *
 * ═══ ASSINATURA ═══
 * `env` é o mesmo objeto `{ url, chave }` que `cron/daily/route.ts` já monta
 * para as próprias tarefas (`lerAmbiente()`) — passado aqui só para esta
 * função poder ser chamada com a mesma cara das outras duas do array de
 * tarefas do cron. O retorno usa exatamente o mesmo formato
 * (`tarefa/alteradas/ignoradas/falhas/resumo`) que `ResultadoTarefa` naquele
 * arquivo.
 */

export type Ambiente = { url: string; chave: string };

export type ResultadoAutomacoes = {
  tarefa: string;
  /** E-mails de carrinho abandonado efetivamente enviados nesta execução. */
  alteradas: number;
  /** Candidatos que a consulta trouxe mas a regra decidiu não avisar. */
  ignoradas: number;
  /** Falhas parciais (uma loja ou um pedido falhou; os outros seguiram). */
  falhas: number;
  /** Frase em português para quem não é dev ler no log da Vercel. */
  resumo: string;
};

const NOME_TAREFA = "automacoes_carrinho_abandonado";

/** Não busca sem limite -- uma loja com fila represada não trava as outras. */
const MAX_CANDIDATOS_POR_LOJA = 50;

type RegraRow = { tenant_id: string; delay_hours: number };
type PedidoCandidato = {
  id: string;
  number: number;
  buyer_name: string;
  buyer_email: string | null;
};

export async function runAutomations(env: Ambiente): Promise<ResultadoAutomacoes> {
  const admin = createClient(env.url, env.chave, { auth: { persistSession: false } });

  // Closure de propósito, em vez de função à parte recebendo `admin` como
  // parâmetro tipado: anotar o tipo do cliente Supabase explicitamente
  // (`SupabaseClient<...>`) colide com os genéricos internos desta versão da
  // lib (erro de "PostgrestVersion" no tsc). Capturar `admin` por closure
  // deixa o TypeScript inferir o tipo certo sozinho, sem escrever essa
  // anotação em lugar nenhum.
  async function processarLoja(
    tenantId: string,
    delayHours: number
  ): Promise<{ enviados: number; ignorados: number; falhas: number }> {
    const agora = new Date();
    const maisAntigoQue = new Date(agora.getTime() - delayHours * 60 * 60 * 1000).toISOString();
    const maisRecenteQue = new Date(
      agora.getTime() - MAX_CANDIDATE_AGE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pedidos, error: pedidosError } = await admin
      .from("orders")
      .select("id, number, buyer_name, buyer_email")
      .eq("tenant_id", tenantId)
      .eq("status", "aguardando_pagamento")
      .eq("payment_status", "pending")
      .lte("created_at", maisAntigoQue)
      .gte("created_at", maisRecenteQue)
      .order("created_at", { ascending: true })
      .limit(MAX_CANDIDATOS_POR_LOJA);

    if (pedidosError) return { enviados: 0, ignorados: 0, falhas: 1 };

    const candidatos = (pedidos ?? []) as PedidoCandidato[];
    if (candidatos.length === 0) return { enviados: 0, ignorados: 0, falhas: 0 };

    // 1ª camada de idempotência (eficiência): não tenta de novo quem já recebeu.
    const ids = candidatos.map((p) => p.id);
    const { data: jaEnviados } = await admin
      .from("automation_runs")
      .select("reference_id")
      .eq("tenant_id", tenantId)
      .eq("kind", CARRINHO_ABANDONADO)
      .in("reference_id", ids);
    const enviadosAntes = new Set((jaEnviados ?? []).map((r) => r.reference_id as string));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const brand = await getEmailBrand(tenantId);

    let enviados = 0;
    let ignorados = 0;
    let falhas = 0;

    for (const pedido of candidatos) {
      if (enviadosAntes.has(pedido.id)) {
        ignorados += 1;
        continue;
      }
      if (!pedido.buyer_email) {
        ignorados += 1;
        continue;
      }

      try {
        const { data: itens } = await admin
          .from("order_items")
          .select("name")
          .eq("tenant_id", tenantId)
          .eq("order_id", pedido.id)
          .eq("kind", "product");
        const itemNames = (itens ?? []).map((i) => i.name as string);

        // Rotaciona o token do pedido -- ver comentário do topo do arquivo.
        const token = generatePublicToken();
        const { data: tokenAtualizado } = await admin
          .from("orders")
          .update({ public_token_hash: hashToken(token) })
          .eq("id", pedido.id)
          .eq("tenant_id", tenantId)
          .select("id");
        if (!tokenAtualizado || tokenAtualizado.length === 0) {
          falhas += 1;
          continue;
        }

        // 2ª camada de idempotência (a que garante de verdade): índice único.
        const { data: claim, error: claimError } = await admin
          .from("automation_runs")
          .insert({ tenant_id: tenantId, kind: CARRINHO_ABANDONADO, reference_id: pedido.id })
          .select("id");
        if (claimError) {
          // 23505 = outra execução ganhou a corrida -- não é falha, é o que a
          // trava existe para fazer.
          if (claimError.code === "23505") {
            ignorados += 1;
            continue;
          }
          falhas += 1;
          continue;
        }
        if (!claim || claim.length === 0) {
          falhas += 1;
          continue;
        }

        const { subject, html } = cartRecoveryEmail(
          {
            orderNumber: pedido.number,
            buyerName: pedido.buyer_name,
            itemNames,
            checkoutUrl: `${siteUrl}/pedido/${pedido.id}?t=${token}`,
          },
          brand
        );

        // Melhor esforço: send.ts nunca lança (engole erro e registra no
        // outbox), então isto nunca derruba o laço.
        await sendOrderEmail(tenantId, {
          orderId: pedido.id,
          type: "cart_recovery",
          toEmail: pedido.buyer_email,
          subject,
          html,
        });

        enviados += 1;
      } catch {
        falhas += 1;
      }
    }

    return { enviados, ignorados, falhas };
  }

  const { data: regras, error: regrasError } = await admin
    .from("automation_rules")
    .select("tenant_id, delay_hours")
    .eq("kind", CARRINHO_ABANDONADO)
    .eq("enabled", true);

  if (regrasError) {
    return {
      tarefa: NOME_TAREFA,
      alteradas: 0,
      ignoradas: 0,
      falhas: 1,
      resumo: "Não foi possível ler quais lojas têm a automação ligada. Nada foi enviado.",
    };
  }

  let enviados = 0;
  let ignorados = 0;
  let falhas = 0;

  for (const regra of (regras ?? []) as RegraRow[]) {
    try {
      const resultado = await processarLoja(regra.tenant_id, clampDelayHours(regra.delay_hours));
      enviados += resultado.enviados;
      ignorados += resultado.ignorados;
      falhas += resultado.falhas;
    } catch {
      // Loja inteira falhou de um jeito inesperado -- as outras já processadas
      // (ou as próximas do laço) não são afetadas.
      falhas += 1;
    }
  }

  return {
    tarefa: NOME_TAREFA,
    alteradas: enviados,
    ignoradas: ignorados,
    falhas,
    resumo:
      `${enviados} e-mail(s) de carrinho abandonado enviado(s); ${ignorados} pedido(s) ignorado(s) ` +
      `(já avisado antes ou sem e-mail cadastrado); ${falhas} falha(s).`,
  };
}
