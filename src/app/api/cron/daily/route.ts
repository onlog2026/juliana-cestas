import { timingSafeEqual } from "node:crypto";
import { reportError } from "@/lib/platform/report-error";

/**
 * ROTINA DIÁRIA DA PLATAFORMA.
 *
 * O sistema de plano já sabia dizer "este teste venceu" toda vez que alguém
 * abria o painel — mas ninguém GRAVAVA isso. Enquanto a lojista não entrasse, a
 * loja continuava marcada como `trialing` no banco para o resto do mundo: a
 * vitrine no ar, os relatórios do dono mostrando um teste que acabou há meses.
 * Regra que só existe na hora de desenhar a tela não é regra, é aparência.
 * Este arquivo é a terceira camada: a que escreve a verdade no banco.
 *
 * Duas tarefas, nesta ordem:
 *   1. `expire_trials`    — teste vencido, sem cortesia, vira `overdue`.
 *   2. `storefront_grace` — quem está `overdue` há mais dias que a carência
 *                           configurada tem a VITRINE suspensa (o painel não).
 *
 * ═══ O SEGREDO É A TRAVA, NÃO O VERBO ═══
 * A regra herdada era "cron nunca aceita GET". O caso que originou a regra (a
 * auditoria do Agentop) era um cron **sem autenticação nenhuma**: bastava um
 * crawler, um prefetch do navegador, o robô que gera a pré-visualização de um
 * link no WhatsApp, ou o dono colando a URL na barra, e a rotina rodava.
 *
 * O que protege de verdade é o SEGREDO, não a escolha do verbo. Aqui GET e
 * POST fazem a mesma coisa e passam pela MESMA porta: sem
 * `Authorization: Bearer <CRON_SECRET>` correto, os dois respondem 401 e não
 * tocam em nada. Nenhum dos gatilhos acidentais acima carrega esse cabeçalho.
 *
 * Por que GET precisava passar a valer: o Cron Job da Vercel dispara a rota
 * com **GET** (documentação oficial: "Vercel makes an HTTP GET request") e
 * manda o `Authorization: Bearer <CRON_SECRET>` sozinho quando a variável
 * existe no projeto. Recusando GET, o agendamento de `vercel.json` receberia
 * 405 todo dia e a rotina simplesmente nunca rodaria -- trava que dá a
 * sensação de segurança e o custo de a funcionalidade não existir.
 *
 * ═══ AGENDAMENTO (o que está em `vercel.json`) ═══
 * `{ "path": "/api/cron/daily", "schedule": "0 6 * * *" }` — 06:00 UTC, que é
 * 03:00 em Brasília: madrugada, com a loja parada.
 *
 * **A conta da Vercel é Hobby: no máximo UMA execução por dia, e a hora é
 * aproximada** (o plano Hobby dispara o agendamento uma vez ao dia, dentro da
 * hora marcada, não no minuto exato). Por isso o agendamento é diário e as duas
 * tarefas cabem numa chamada só: não adianta criar um segundo horário, ele não
 * seria executado. Qualquer coisa que precise rodar mais de uma vez por dia
 * exige mudar de plano — isso é decisão de custo do dono.
 *
 * Esta explicação mora AQUI, e não dentro do `vercel.json`, porque aquele
 * arquivo é JSON puro validado pela Vercel: comentário (`//`) ou campo extra
 * inventado fazem o deploy inteiro falhar com "Invalid vercel.json".
 *
 * ═══ SEGURANÇA ═══
 *  - Sem `CRON_SECRET` no ambiente → 503. NUNCA roda sem proteção: uma rotina
 *    que suspende vitrine aberta ao mundo é um botão de desligar a loja.
 *  - Segredo errado → 401, com comparação em TEMPO CONSTANTE.
 *
 * ═══ IDEMPOTÊNCIA ═══
 * Rodar duas vezes no mesmo dia não dobra efeito nenhum, porque cada UPDATE
 * carrega no próprio filtro a condição de origem (`...&subscription_status=eq.trialing`,
 * `...&status=eq.active`). Na segunda passada a loja já não está no estado de
 * partida, o UPDATE não acha linha e a auditoria não é gravada de novo.
 *
 * ═══ O QUE ESTA ROTINA NUNCA FAZ ═══
 *  - Nunca toca na loja fundadora (a da Juliana). Cinto e suspensório: ela é
 *    filtrada no código mesmo já estando `active` no banco.
 *  - Nunca fecha o PAINEL. `status = 'suspended'` derruba só a vitrine; a
 *    lojista continua entrando para regularizar. Trancar as duas coisas juntas
 *    é trancar a saída de emergência.
 *  - Nunca deixa uma tarefa derrubar a outra: cada uma tem o próprio try/catch
 *    e registra a falha com `reportError`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Quem aparece como autor na auditoria. Não é pessoa: é a rotina. */
const ATOR = "rotina-diaria@plataforma";

/** Plano da primeira loja da plataforma — nunca é tocado por esta rotina. */
const PLANO_FUNDADORA = "fundadora";

/** Carência usada quando `saas_config` não puder ser lida. Igual ao default da migração 0026. */
const CARENCIA_PADRAO_DIAS = 7;

const DIA_EM_MS = 24 * 60 * 60 * 1000;

type TenantRow = {
  id: string;
  slug: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  status: string | null;
  trial_ends_at: string | null;
  paid_until: string | null;
  bonus_until: string | null;
  updated_at: string | null;
};

const COLUNAS =
  "id,slug,subscription_plan,subscription_status,status,trial_ends_at,paid_until,bonus_until,updated_at";

type ResultadoTarefa = {
  tarefa: string;
  /** Lojas efetivamente alteradas nesta execução. */
  alteradas: number;
  /** Lojas que a consulta trouxe mas que a regra decidiu não tocar. */
  ignoradas: number;
  /** Falhas parciais (uma loja falhou, as outras seguiram). */
  falhas: number;
  /** Frase em português para quem não é dev ler no log da Vercel. */
  resumo: string;
};

// ── Acesso ao banco ─────────────────────────────────────────────────────────
// Auto-contido de propósito: `fetch` direto no PostgREST com a service role.
// Um import quebrado aqui pararia a rotina em silêncio, e rotina parada em
// silêncio é exatamente o problema que este arquivo veio resolver.

type Ambiente = { url: string; chave: string };

function lerAmbiente(): Ambiente | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !chave) return null;
  return { url, chave };
}

function cabecalhos(env: Ambiente, extras?: Record<string, string>): Record<string, string> {
  return {
    apikey: env.chave,
    authorization: `Bearer ${env.chave}`,
    "content-type": "application/json",
    ...extras,
  };
}

async function selecionar<T>(env: Ambiente, caminho: string): Promise<T[]> {
  const resposta = await fetch(`${env.url}/rest/v1/${caminho}`, {
    method: "GET",
    headers: cabecalhos(env),
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`consulta falhou (${resposta.status}): ${await resposta.text()}`);
  }
  return (await resposta.json()) as T[];
}

/**
 * UPDATE que devolve as linhas alteradas.
 *
 * `Prefer: return=representation` + `select=id` é o que transforma "não deu
 * erro" em "mudou mesmo". Sem isso, um UPDATE que não pegou nenhuma linha volta
 * 204 e a rotina registraria na auditoria uma mudança que nunca aconteceu.
 */
async function atualizar(env: Ambiente, caminho: string, corpo: Record<string, unknown>): Promise<string[]> {
  const separador = caminho.includes("?") ? "&" : "?";
  const resposta = await fetch(`${env.url}/rest/v1/${caminho}${separador}select=id`, {
    method: "PATCH",
    headers: cabecalhos(env, { prefer: "return=representation" }),
    body: JSON.stringify(corpo),
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`atualização falhou (${resposta.status}): ${await resposta.text()}`);
  }
  const linhas = (await resposta.json()) as { id: string }[];
  return (linhas ?? []).map((l) => l.id);
}

/** Auditoria. Não pode derrubar a tarefa: no pior caso avisa no console. */
async function auditar(
  env: Ambiente,
  entrada: { tenantId: string; action: string; target: string | null; before: unknown; after: unknown }
): Promise<void> {
  try {
    const resposta = await fetch(`${env.url}/rest/v1/audit_logs`, {
      method: "POST",
      headers: cabecalhos(env, { prefer: "return=minimal" }),
      body: JSON.stringify({
        tenant_id: entrada.tenantId,
        actor_email: ATOR,
        action: entrada.action,
        target: entrada.target,
        before: entrada.before ?? null,
        after: entrada.after ?? null,
      }),
      cache: "no-store",
    });
    if (!resposta.ok) {
      console.error("[cron-diario] falha ao gravar auditoria:", resposta.status, await resposta.text());
    }
  } catch (e) {
    console.error("[cron-diario] não foi possível gravar a auditoria:", e);
  }
}

// ── Datas ───────────────────────────────────────────────────────────────────

function paraData(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** A data existe E ainda não passou? Data ausente NUNCA vale como "vale para sempre". */
function noFuturo(valor: string | null | undefined, agora: Date): boolean {
  const d = paraData(valor);
  return d !== null && d.getTime() > agora.getTime();
}

// ── Tarefa 1: teste vencido vira "em atraso" ────────────────────────────────

async function expirarTestes(env: Ambiente, agora: Date): Promise<ResultadoTarefa> {
  const agoraIso = agora.toISOString();
  // `trial_ends_at=lt.<agora>` já exclui quem está sem data marcada — de
  // propósito, e igual à regra do painel: teste sem prazo calculado continua
  // valendo. Errar liberando é o lado certo de errar aqui.
  const lojas = await selecionar<TenantRow>(
    env,
    `tenants?select=${COLUNAS}&subscription_status=eq.trialing&trial_ends_at=lt.${encodeURIComponent(agoraIso)}`
  );

  let alteradas = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const loja of lojas) {
    // Cortesia válida do dono da plataforma segura o vencimento. É exatamente
    // para isso que a cortesia existe.
    if (noFuturo(loja.bonus_until, agora)) {
      ignoradas += 1;
      continue;
    }
    if (loja.subscription_plan === PLANO_FUNDADORA) {
      ignoradas += 1;
      continue;
    }

    try {
      const alteradosIds = await atualizar(
        env,
        `tenants?id=eq.${loja.id}&subscription_status=eq.trialing`,
        { subscription_status: "overdue" }
      );
      if (alteradosIds.length === 0) {
        // Outra execução (ou o webhook do Asaas) chegou primeiro. Não é erro e
        // não vira auditoria: nada mudou por causa desta passada.
        ignoradas += 1;
        continue;
      }
      alteradas += 1;
      await auditar(env, {
        tenantId: loja.id,
        action: "teste_vencido_pela_rotina_diaria",
        target: loja.slug,
        before: { subscription_status: loja.subscription_status, trial_ends_at: loja.trial_ends_at },
        after: { subscription_status: "overdue" },
      });
    } catch (e) {
      falhas += 1;
      await reportError({
        tenantId: loja.id,
        module: "rotina_diaria",
        action: "expire_trials",
        level: "error",
        message: "Não foi possível marcar o teste desta loja como vencido.",
        detail: { lojaId: loja.id, slug: loja.slug, erro: e },
      });
    }
  }

  return {
    tarefa: "expire_trials",
    alteradas,
    ignoradas,
    falhas,
    resumo: `${alteradas} loja(s) tiveram o teste marcado como vencido; ${ignoradas} não precisavam mudar; ${falhas} falharam.`,
  };
}

// ── Tarefa 2: vitrine suspensa depois da carência ───────────────────────────

/** Quantos dias de carência a plataforma dá. Falha de leitura cai no padrão. */
async function lerCarenciaEmDias(env: Ambiente): Promise<number> {
  try {
    const linhas = await selecionar<{ storefront_grace_days: number | null }>(
      env,
      "saas_config?select=storefront_grace_days&id=eq.1"
    );
    const valor = linhas[0]?.storefront_grace_days;
    if (typeof valor === "number" && Number.isFinite(valor) && valor >= 0) return valor;
  } catch (e) {
    console.error("[cron-diario] não consegui ler storefront_grace_days, usando o padrão:", e);
  }
  return CARENCIA_PADRAO_DIAS;
}

/**
 * Desde quando esta loja está devendo.
 *
 * Não existe coluna `overdue_since` no banco, então a data é deduzida, nesta
 * ordem: fim da vigência paga → fim do teste → última alteração da linha.
 * `updated_at` é o último recurso e é PROPOSITALMENTE generoso: qualquer
 * edição da loja reinicia a contagem, o que atrasa a suspensão. Errar para o
 * lado de deixar a vitrine no ar por mais tempo é barato; derrubar a vitrine de
 * quem não devia, não.
 */
function devendoDesde(loja: TenantRow): Date | null {
  return paraData(loja.paid_until) ?? paraData(loja.trial_ends_at) ?? paraData(loja.updated_at);
}

async function suspenderVitrines(env: Ambiente, agora: Date): Promise<ResultadoTarefa> {
  const carenciaDias = await lerCarenciaEmDias(env);
  const lojas = await selecionar<TenantRow>(
    env,
    `tenants?select=${COLUNAS}&subscription_status=eq.overdue&status=eq.active`
  );

  let alteradas = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const loja of lojas) {
    if (loja.subscription_plan === PLANO_FUNDADORA) {
      ignoradas += 1;
      continue;
    }
    if (noFuturo(loja.bonus_until, agora)) {
      ignoradas += 1;
      continue;
    }

    const desde = devendoDesde(loja);
    if (!desde) {
      // Sem nenhuma data para ancorar a contagem, a rotina não inventa uma.
      ignoradas += 1;
      continue;
    }
    const diasDevendo = (agora.getTime() - desde.getTime()) / DIA_EM_MS;
    if (diasDevendo <= carenciaDias) {
      ignoradas += 1;
      continue;
    }

    try {
      const alteradosIds = await atualizar(env, `tenants?id=eq.${loja.id}&status=eq.active`, {
        status: "suspended",
      });
      if (alteradosIds.length === 0) {
        ignoradas += 1;
        continue;
      }
      alteradas += 1;
      await auditar(env, {
        tenantId: loja.id,
        action: "vitrine_suspensa_pela_rotina_diaria",
        target: loja.slug,
        before: { status: loja.status, subscription_status: loja.subscription_status },
        after: { status: "suspended", diasDevendo: Math.floor(diasDevendo), carenciaDias },
      });
    } catch (e) {
      falhas += 1;
      await reportError({
        tenantId: loja.id,
        module: "rotina_diaria",
        action: "storefront_grace",
        level: "error",
        message: "Não foi possível suspender a vitrine desta loja em atraso.",
        detail: { lojaId: loja.id, slug: loja.slug, carenciaDias, erro: e },
      });
    }
  }

  return {
    tarefa: "storefront_grace",
    alteradas,
    ignoradas,
    falhas,
    resumo:
      `${alteradas} vitrine(s) suspensa(s) após ${carenciaDias} dia(s) de carência; ` +
      `${ignoradas} ainda dentro do prazo ou fora da regra; ${falhas} falharam.`,
  };
}

// ── Porta de entrada ────────────────────────────────────────────────────────

function json(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Comparação do segredo em tempo constante — nunca `===`. */
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido, "utf8");
  const b = Buffer.from(esperado, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * GET existe porque é assim que o agendador da Vercel chama. Passa pela mesma
 * verificação de segredo do POST -- sem o cabeçalho correto, não roda nada.
 */
export async function GET(request: Request): Promise<Response> {
  return executarRotina(request);
}

export async function POST(request: Request): Promise<Response> {
  return executarRotina(request);
}

async function executarRotina(request: Request): Promise<Response> {
  const esperado = process.env.CRON_SECRET ?? "";
  if (!esperado) {
    return json(
      {
        ok: false,
        erro: "cron_secret_ausente",
        mensagem:
          "A rotina diária está desligada porque falta a variável de ambiente CRON_SECRET. " +
          "Cadastre um segredo nas configurações do projeto na Vercel e faça um novo deploy — " +
          "sem ele esta rotina não roda, de propósito.",
      },
      503
    );
  }

  const cabecalho = request.headers.get("authorization") ?? "";
  const prefixo = "Bearer ";
  const recebido = cabecalho.startsWith(prefixo) ? cabecalho.slice(prefixo.length) : "";
  if (!recebido || !segredoConfere(recebido, esperado)) {
    return json(
      {
        ok: false,
        erro: "nao_autorizado",
        mensagem: "Segredo da rotina ausente ou incorreto.",
      },
      401
    );
  }

  const env = lerAmbiente();
  if (!env) {
    return json(
      {
        ok: false,
        erro: "banco_nao_configurado",
        mensagem:
          "Faltam as variáveis de ambiente do banco (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). " +
          "A rotina não rodou e nada foi alterado.",
      },
      503
    );
  }

  const agora = new Date();
  const resultados: ResultadoTarefa[] = [];

  // Cada tarefa isolada: a segunda roda mesmo se a primeira falhar inteira.
  for (const tarefa of [
    { nome: "expire_trials", executar: () => expirarTestes(env, agora) },
    { nome: "storefront_grace", executar: () => suspenderVitrines(env, agora) },
  ]) {
    try {
      resultados.push(await tarefa.executar());
    } catch (e) {
      await reportError({
        module: "rotina_diaria",
        action: tarefa.nome,
        level: "critical",
        message: `A tarefa "${tarefa.nome}" da rotina diária falhou inteira e não alterou nada.`,
        detail: { erro: e },
      });
      resultados.push({
        tarefa: tarefa.nome,
        alteradas: 0,
        ignoradas: 0,
        falhas: 1,
        resumo: "A tarefa falhou por inteiro. O erro está registrado em /super/erros.",
      });
    }
  }

  const houveFalha = resultados.some((r) => r.falhas > 0);
  return json(
    {
      ok: !houveFalha,
      executadoEm: agora.toISOString(),
      tarefas: resultados,
    },
    200
  );
}
