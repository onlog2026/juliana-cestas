import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A ROTINA DIÁRIA é a única coisa no sistema que muda a situação de uma loja
 * sem ninguém clicar em nada. Um erro aqui não aparece em tela nenhuma: aparece
 * como uma vitrine que saiu do ar sozinha, ou como um teste que nunca vence.
 *
 * Por isso estes cinco testes provam exatamente os cinco comportamentos que, se
 * estiverem errados, custam caro:
 *
 *   sem CRON_SECRET no ambiente     → 503 e NADA é executado
 *   segredo errado                  → 401 e NADA é executado
 *   GET                             → 405 e NADA é executado
 *   loja com cortesia válida        → NÃO tem o teste expirado
 *   loja que já está `overdue`      → NÃO é expirada de novo (idempotência)
 *
 * O banco é falsificado por `fetch` (a rota fala PostgREST por REST puro), o
 * que deixa cada chamada visível e verificável.
 */

// O registrador de erros vai ao banco de verdade; aqui ele só precisa não
// atrapalhar. As chamadas ficam guardadas para o caso de um teste querer olhar.
const errosRegistrados: unknown[] = [];
vi.mock("@/lib/platform/report-error", () => ({
  reportError: vi.fn(async (input: unknown) => {
    errosRegistrados.push(input);
  }),
}));

const { GET, POST } = await import("../../src/app/api/cron/daily/route");

const SUPABASE_URL = "https://projeto.supabase.co";
const SEGREDO = "segredo-da-rotina-diaria-32-chars!!";
const LOJA_A = "11111111-1111-4111-8111-111111111111";

type Chamada = { url: string; method: string; body: unknown };

let chamadas: Chamada[] = [];
let rotas: Array<{ casa: (url: string, metodo: string) => boolean; responde: () => Response }> = [];

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });
}

function rota(metodo: string, trecho: string, responde: () => Response) {
  rotas.push({ casa: (url, m) => m === metodo && url.includes(trecho), responde });
}

function instalarFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (entrada: string, init?: RequestInit) => {
      const url = String(entrada);
      const method = init?.method ?? "GET";
      chamadas.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const achou = rotas.find((r) => r.casa(url, method));
      if (achou) return achou.responde();
      // Qualquer consulta não programada volta vazia: o teste que precisar de
      // dado programa a rota dele.
      return json([]);
    })
  );
}

/** Uma requisição POST com o cabeçalho de autorização já montado. */
function requisicao(opcoes?: { segredo?: string | null }) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const seg = opcoes?.segredo === undefined ? SEGREDO : opcoes.segredo;
  if (seg) headers.authorization = `Bearer ${seg}`;
  return new Request("https://loja.com.br/api/cron/daily", { method: "POST", headers });
}

/** Uma loja em teste, com o prazo já vencido há 10 dias. */
function lojaComTesteVencido(extras: Record<string, unknown> = {}) {
  const dezDiasAtras = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: LOJA_A,
    slug: "loja-teste",
    subscription_plan: "essencial",
    subscription_status: "trialing",
    status: "active",
    trial_ends_at: dezDiasAtras,
    paid_until: null,
    bonus_until: null,
    updated_at: dezDiasAtras,
    ...extras,
  };
}

/** Só as chamadas que MUDAM alguma coisa no banco. */
function escritas() {
  return chamadas.filter((c) => c.method === "PATCH" || c.method === "POST");
}

beforeEach(() => {
  chamadas = [];
  rotas = [];
  errosRegistrados.length = 0;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-mentira");
  vi.stubEnv("CRON_SECRET", SEGREDO);
  instalarFetch();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rotina diária — porta de entrada", () => {
  it("sem CRON_SECRET no ambiente devolve 503 e não toca no banco", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(503);
    expect(corpo.erro).toBe("cron_secret_ausente");
    // A mensagem é lida por quem não é dev: tem que dizer o que fazer.
    expect(corpo.mensagem).toContain("CRON_SECRET");
    expect(chamadas).toHaveLength(0);
  });

  it("com o segredo errado devolve 401 e não toca no banco", async () => {
    const resposta = await POST(requisicao({ segredo: "segredo-errado-mas-do-mesmo-tamanho" }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(401);
    expect(corpo.erro).toBe("nao_autorizado");
    expect(chamadas).toHaveLength(0);
  });

  it("sem nenhum cabeçalho de autorização devolve 401", async () => {
    const resposta = await POST(requisicao({ segredo: null }));

    expect(resposta.status).toBe(401);
    expect(chamadas).toHaveLength(0);
  });

  // O agendador da Vercel chama por GET e manda o segredo sozinho. Por isso
  // GET vale -- mas passa pela MESMA porta do POST. O que protege é o segredo,
  // não o verbo: sem o cabeçalho, nada roda.
  it("GET SEM segredo não executa tarefa nenhuma", async () => {
    const resposta = await GET(requisicao({ segredo: null }));

    expect(resposta.status).toBe(401);
    expect(chamadas).toHaveLength(0);
  });

  it("GET com segredo ERRADO não executa tarefa nenhuma", async () => {
    const resposta = await GET(requisicao({ segredo: "segredo-errado-mas-do-mesmo-tamanho" }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(401);
    expect(corpo.erro).toBe("nao_autorizado");
    expect(chamadas).toHaveLength(0);
  });

  it("GET com o segredo certo roda igual ao POST (é assim que a Vercel chama)", async () => {
    const resposta = await GET(requisicao());

    expect(resposta.status).toBe(200);
  });
});

describe("rotina diária — expire_trials", () => {
  it("loja com cortesia válida NÃO tem o teste expirado", async () => {
    const daquiTrintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    rota("GET", "subscription_status=eq.trialing", () =>
      json([lojaComTesteVencido({ bonus_until: daquiTrintaDias })])
    );

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    // Nenhuma escrita: nem o UPDATE da loja, nem a linha de auditoria.
    expect(escritas()).toHaveLength(0);

    const tarefa = corpo.tarefas.find((t: { tarefa: string }) => t.tarefa === "expire_trials");
    expect(tarefa.alteradas).toBe(0);
    expect(tarefa.ignoradas).toBe(1);
  });

  it("loja com o teste vencido e sem cortesia passa para overdue e vira auditoria", async () => {
    rota("GET", "subscription_status=eq.trialing", () => json([lojaComTesteVencido()]));
    rota("PATCH", "tenants?id=eq.", () => json([{ id: LOJA_A }]));

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);

    const update = escritas().find((c) => c.method === "PATCH");
    expect(update).toBeDefined();
    expect(update!.body).toEqual({ subscription_status: "overdue" });
    // O filtro do próprio UPDATE é o que garante a idempotência.
    expect(update!.url).toContain("subscription_status=eq.trialing");
    // E o `select=id` é o que prova que a linha existiu mesmo.
    expect(update!.url).toContain("select=id");

    const auditoria = escritas().find((c) => c.url.includes("audit_logs"));
    expect(auditoria).toBeDefined();
    expect((auditoria!.body as { action: string }).action).toBe("teste_vencido_pela_rotina_diaria");

    const tarefa = corpo.tarefas.find((t: { tarefa: string }) => t.tarefa === "expire_trials");
    expect(tarefa.alteradas).toBe(1);
  });

  it("loja que JÁ está overdue não é expirada de novo (rodar duas vezes não dobra efeito)", async () => {
    // Segunda passada do mesmo dia: a consulta por `trialing` não traz mais a
    // loja, porque ela já mudou de estado na primeira.
    rota("GET", "subscription_status=eq.trialing", () => json([]));
    rota("GET", "subscription_status=eq.overdue", () => json([]));

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(escritas()).toHaveLength(0);

    const tarefa = corpo.tarefas.find((t: { tarefa: string }) => t.tarefa === "expire_trials");
    expect(tarefa.alteradas).toBe(0);
  });

  it("se duas execuções correrem juntas, o UPDATE que não pegar linha não vira auditoria", async () => {
    // A outra execução chegou primeiro: o PATCH volta lista vazia.
    rota("GET", "subscription_status=eq.trialing", () => json([lojaComTesteVencido()]));
    rota("PATCH", "tenants?id=eq.", () => json([]));

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(escritas().some((c) => c.url.includes("audit_logs"))).toBe(false);

    const tarefa = corpo.tarefas.find((t: { tarefa: string }) => t.tarefa === "expire_trials");
    expect(tarefa.alteradas).toBe(0);
    expect(tarefa.ignoradas).toBe(1);
  });

  it("a loja fundadora nunca é tocada, mesmo com data vencida", async () => {
    rota("GET", "subscription_status=eq.trialing", () =>
      json([lojaComTesteVencido({ subscription_plan: "fundadora" })])
    );

    await POST(requisicao());

    expect(escritas()).toHaveLength(0);
  });
});

describe("rotina diária — storefront_grace", () => {
  function lojaEmAtraso(extras: Record<string, unknown> = {}) {
    const vinteDiasAtras = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: LOJA_A,
      slug: "loja-atrasada",
      subscription_plan: "essencial",
      subscription_status: "overdue",
      status: "active",
      trial_ends_at: null,
      paid_until: vinteDiasAtras,
      bonus_until: null,
      updated_at: vinteDiasAtras,
      ...extras,
    };
  }

  it("passada a carência, a vitrine é suspensa e o painel não é tocado", async () => {
    rota("GET", "saas_config", () => json([{ storefront_grace_days: 7 }]));
    rota("GET", "subscription_status=eq.overdue", () => json([lojaEmAtraso()]));
    rota("PATCH", "tenants?id=eq.", () => json([{ id: LOJA_A }]));

    const resposta = await POST(requisicao());
    const corpo = await resposta.json();

    const update = escritas().find((c) => c.method === "PATCH");
    expect(update!.body).toEqual({ status: "suspended" });
    // Só a VITRINE: `subscription_status` não entra no corpo do UPDATE.
    expect(Object.keys(update!.body as object)).toEqual(["status"]);
    expect(update!.url).toContain("status=eq.active");

    const tarefa = corpo.tarefas.find((t: { tarefa: string }) => t.tarefa === "storefront_grace");
    expect(tarefa.alteradas).toBe(1);
    expect(resposta.status).toBe(200);
  });

  it("dentro da carência, a vitrine continua no ar", async () => {
    const ontem = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    rota("GET", "saas_config", () => json([{ storefront_grace_days: 7 }]));
    rota("GET", "subscription_status=eq.overdue", () => json([lojaEmAtraso({ paid_until: ontem, updated_at: ontem })]));

    await POST(requisicao());

    expect(escritas()).toHaveLength(0);
  });
});
