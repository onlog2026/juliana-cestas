import { describe, expect, it } from "vitest";
import {
  accountState,
  diasAte,
  resolveAllowedModules,
  resolveModuleAccess,
  type PlanModuleRule,
  type ResolveModuleAccessInput,
  type TenantBilling,
} from "@/modules/entitlements/resolve";
import { MODULE_SLUGS } from "@/lib/modules/registry";

/**
 * A regra de acesso é pura: recebe até o relógio por parâmetro. Por isso dá
 * para provar aqui, sem banco, sem servidor e sem esperar nada.
 *
 * Os casos abaixo não são "cobertura": cada um deles é uma armadilha que já
 * custou incidente real (documentada em docs/SUPER-ADMIN-SPEC.md) ou uma regra
 * que, se inverter em silêncio, tira o acesso de alguém que pagou -- ou dá
 * acesso a quem não pagou.
 */

const AGORA = new Date("2026-09-06T12:00:00Z");
const FUTURO = "2026-10-01T00:00:00Z"; // ~25 dias à frente
const PASSADO = "2026-08-01T00:00:00Z";

function loja(over: Partial<TenantBilling> = {}): TenantBilling {
  return {
    subscriptionPlan: "basico",
    subscriptionStatus: "active",
    trialEndsAt: null,
    paidUntil: FUTURO,
    bonusUntil: null,
    bonusPlanSlug: null,
    grantedModules: [],
    grantedModulesUntil: null,
    ...over,
  };
}

const REGRAS_BASICO: PlanModuleRule[] = [
  { moduleSlug: "entregas", status: "included" },
  { moduleSlug: "cupons", status: "included" },
  { moduleSlug: "cms", status: "addon" },
  { moduleSlug: "seo", status: "excluded" },
  { moduleSlug: "ia", status: "excluded" },
];

const REGRAS_PRO: PlanModuleRule[] = MODULE_SLUGS.map((slug) => ({ moduleSlug: slug, status: "included" as const }));

const PLAN_MODULES: Record<string, PlanModuleRule[]> = {
  basico: REGRAS_BASICO,
  pro: REGRAS_PRO,
  // `fundadora` de propósito NÃO entra aqui em vários testes: é assim que se
  // prova que a loja da Juliana continua liberada mesmo se as regras do plano
  // dela sumirem do banco.
};

function acesso(modulo: string, over: Partial<ResolveModuleAccessInput> = {}) {
  return resolveModuleAccess({
    tenant: loja(),
    plan: { slug: "basico", name: "Básico" },
    planModules: PLAN_MODULES,
    staff: { isSuperAdmin: false },
    module: modulo,
    agora: AGORA,
    config: { trialModuleSlugs: null },
    ...over,
  });
}

// ── Quem passa por cima de tudo ─────────────────────────────────────────────

describe("super admin e loja fundadora", () => {
  it("1. super admin entra até numa loja cancelada, em módulo fora do plano", () => {
    const r = acesso("ia", {
      tenant: loja({ subscriptionStatus: "canceled" }),
      staff: { isSuperAdmin: true },
    });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("super_admin");
  });

  it("2. a loja fundadora libera módulo que NÃO está em plan_modules e nunca fica bloqueada", () => {
    const juliana = loja({ subscriptionPlan: "fundadora", subscriptionStatus: "canceled", paidUntil: PASSADO });
    // Nem o plano nem as regras dele existem no mapa: mesmo assim, libera.
    const r = acesso("ia", { tenant: juliana, plan: null, planModules: {} });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("plano_fundadora");
    expect(accountState(juliana, AGORA)).toBe("ok");
  });

  it("3. a loja fundadora vê TODOS os módulos -- é o menu inteiro da Juliana", () => {
    const juliana = loja({ subscriptionPlan: "fundadora", subscriptionStatus: "canceled" });
    const liberados = resolveAllowedModules(
      {
        tenant: juliana,
        plan: null,
        planModules: {},
        staff: { isSuperAdmin: false },
        agora: AGORA,
        config: { trialModuleSlugs: [] },
      },
      MODULE_SLUGS
    );
    expect(liberados).toEqual([...MODULE_SLUGS]);
  });
});

// ── Conta bloqueada ─────────────────────────────────────────────────────────

describe("conta bloqueada", () => {
  it("4. teste VENCIDO com status ainda 'trialing' bloqueia -- a data manda, não o texto", () => {
    const vencida = loja({ subscriptionStatus: "trialing", trialEndsAt: PASSADO, paidUntil: null });
    expect(accountState(vencida, AGORA)).toBe("teste_vencido");
    const r = acesso("cupons", { tenant: vencida });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("teste_vencido");
  });

  it("5. mesmo bloqueada, configurações e assinatura continuam abertas (é por onde se volta a pagar)", () => {
    const cancelada = loja({ subscriptionStatus: "canceled" });
    expect(acesso("configuracoes", { tenant: cancelada })).toEqual({
      allowed: true,
      reason: "excecao_conta_bloqueada",
    });
    expect(acesso("assinatura", { tenant: cancelada }).allowed).toBe(true);
  });

  it("6. conta bloqueada fecha até módulo do núcleo (o bloqueio vem ANTES do núcleo, de propósito)", () => {
    const cancelada = loja({ subscriptionStatus: "canceled" });
    const r = acesso("pedidos", { tenant: cancelada });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("conta_bloqueada");
  });
});

// ── Núcleo ──────────────────────────────────────────────────────────────────

describe("módulos do núcleo", () => {
  it("7. núcleo é liberado mesmo sem plano nenhum e mesmo se o plano excluir tudo", () => {
    const semPlano = loja({ subscriptionPlan: null });
    for (const slug of ["dashboard", "pedidos", "produtos", "configuracoes", "pagamentos"]) {
      const r = acesso(slug, { tenant: semPlano, plan: null });
      expect(r.allowed, `núcleo "${slug}" deveria estar liberado`).toBe(true);
      expect(r.reason).toBe("modulo_do_nucleo");
    }
  });
});

// ── Cortesia do dono da plataforma ──────────────────────────────────────────

describe("cortesia (bonus)", () => {
  it("8. cortesia ATIVA de um plano superior libera módulo que o plano contratado não tem", () => {
    const comCortesia = loja({ bonusUntil: FUTURO, bonusPlanSlug: "pro" });
    const r = acesso("ia", { tenant: comCortesia });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("incluso_no_plano_da_cortesia");
  });

  it("9. cortesia VENCIDA não vale nada: volta a valer o plano contratado", () => {
    const cortesiaVencida = loja({ bonusUntil: PASSADO, bonusPlanSlug: "pro" });
    const r = acesso("ia", { tenant: cortesiaVencida });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("nao_incluso_no_plano");
  });

  it("10. cortesia ativa segura a conta em dia mesmo com a assinatura cancelada", () => {
    const emCortesia = loja({ subscriptionStatus: "canceled", bonusUntil: FUTURO, bonusPlanSlug: "pro" });
    expect(accountState(emCortesia, AGORA)).toBe("ok");
    expect(acesso("cupons", { tenant: emCortesia }).allowed).toBe(true);
  });
});

// ── Teste grátis ────────────────────────────────────────────────────────────

describe("teste grátis", () => {
  const emTeste = loja({ subscriptionStatus: "trialing", trialEndsAt: FUTURO, paidUntil: null });

  it("11. teste ativo com trial_module_slugs nulo libera TUDO", () => {
    expect(accountState(emTeste, AGORA)).toBe("teste");
    const r = acesso("ia", { tenant: emTeste, config: { trialModuleSlugs: null } });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("teste_libera_tudo");
  });

  it("12. teste com lista libera só o que está na lista -- o resto cai no plano", () => {
    const config = { trialModuleSlugs: ["ia"] };
    expect(acesso("ia", { tenant: emTeste, config })).toEqual({
      allowed: true,
      reason: "teste_libera_este_modulo",
    });
    // Fora da lista do teste, mas incluído no plano contratado: continua valendo.
    expect(acesso("cupons", { tenant: emTeste, config }).reason).toBe("incluso_no_plano");
    // Fora da lista e fora do plano: nega.
    expect(acesso("seo", { tenant: emTeste, config }).allowed).toBe(false);
  });

  it("13. teste sem data marcada é tratado como teste ATIVO (errar liberando, não trancando)", () => {
    const semData = loja({ subscriptionStatus: "trialing", trialEndsAt: null, paidUntil: null });
    expect(accountState(semData, AGORA)).toBe("teste");
    expect(acesso("ia", { tenant: semData }).allowed).toBe(true);
  });
});

// ── Módulos soltos liberados por voucher ────────────────────────────────────

describe("granted_modules (voucher)", () => {
  it("14. granted_modules com prazo no FUTURO libera o módulo", () => {
    const t = loja({ grantedModules: ["ia"], grantedModulesUntil: FUTURO });
    const r = acesso("ia", { tenant: t });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("liberado_por_cortesia_de_modulo");
  });

  it("15. granted_modules com prazo no PASSADO não libera nada", () => {
    const t = loja({ grantedModules: ["ia"], grantedModulesUntil: PASSADO });
    expect(acesso("ia", { tenant: t }).allowed).toBe(false);
  });

  it("16. granted_modules SEM prazo não libera: as duas colunas são um par indivisível", () => {
    const t = loja({ grantedModules: ["ia"], grantedModulesUntil: null });
    expect(acesso("ia", { tenant: t }).allowed).toBe(false);
  });
});

// ── O plano ─────────────────────────────────────────────────────────────────

describe("o plano contratado", () => {
  it("17. plano que não existe na tabela nega, com motivo próprio -- mas o núcleo continua de pé", () => {
    const t = loja({ subscriptionPlan: "plano-que-nao-existe" });
    const r = acesso("cupons", { tenant: t, plan: null });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("plano_nao_encontrado");
    expect(acesso("pedidos", { tenant: t, plan: null }).allowed).toBe(true);
  });

  it("18. loja sem plano nenhum nega módulo pago com motivo 'sem_plano'", () => {
    const t = loja({ subscriptionPlan: null });
    const r = acesso("cupons", { tenant: t, plan: null });
    expect(r).toEqual({ allowed: false, reason: "sem_plano" });
  });

  it("19. add-on não contratado nega com motivo próprio (existe no plano, mas se compra à parte)", () => {
    expect(acesso("cms")).toEqual({ allowed: false, reason: "addon_nao_contratado" });
  });

  it("20. módulo 'excluded' e módulo que nem está na tabela do plano negam igual", () => {
    expect(acesso("seo").reason).toBe("nao_incluso_no_plano");
    expect(acesso("avaliacoes").reason).toBe("nao_incluso_no_plano");
  });

  it("21. módulo que o código não conhece NUNCA é liberado por engano", () => {
    const r = acesso("modulo-inventado-no-painel");
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("modulo_desconhecido");
  });
});

// ── Situação da conta ───────────────────────────────────────────────────────

describe("accountState", () => {
  it("22. atrasada e pendente AVISAM, mas não trancam", () => {
    for (const status of ["overdue", "pending"]) {
      const t = loja({ subscriptionStatus: status });
      expect(accountState(t, AGORA), status).toBe("atrasado");
      expect(acesso("cupons", { tenant: t }).allowed, status).toBe(true);
    }
  });

  it("23. ativa com vigência vencida vira 'atrasado' (o webhook de renovação ainda não chegou)", () => {
    expect(accountState(loja({ subscriptionStatus: "active", paidUntil: PASSADO }), AGORA)).toBe("atrasado");
  });

  it("24. ativa em dia é 'ok'", () => {
    expect(accountState(loja(), AGORA)).toBe("ok");
  });

  it("25. status desconhecido não vira bloqueio", () => {
    expect(accountState(loja({ subscriptionStatus: "coisa_nova" }), AGORA)).toBe("ok");
    expect(accountState(loja({ subscriptionStatus: null }), AGORA)).toBe("ok");
  });

  it("26. cancelada e inativa bloqueiam", () => {
    expect(accountState(loja({ subscriptionStatus: "canceled" }), AGORA)).toBe("bloqueado");
    expect(accountState(loja({ subscriptionStatus: "inactive" }), AGORA)).toBe("bloqueado");
  });

  it("27. data podre (texto inválido) não derruba nem libera por engano", () => {
    const t = loja({ subscriptionStatus: "trialing", trialEndsAt: "não é data", paidUntil: null });
    // Sem data válida = sem prazo = teste ativo (mesmo caminho do caso 13).
    expect(accountState(t, AGORA)).toBe("teste");
  });
});

describe("diasAte", () => {
  it("28. conta os dias que faltam, nunca devolve negativo e trata data ausente", () => {
    expect(diasAte("2026-09-08T12:00:00Z", AGORA)).toBe(2);
    expect(diasAte("2026-09-06T13:00:00Z", AGORA)).toBe(1); // menos de um dia arredonda para 1
    expect(diasAte(PASSADO, AGORA)).toBe(0);
    expect(diasAte(null, AGORA)).toBeNull();
  });
});

// ── O menu, do jeito que ele será montado ───────────────────────────────────

describe("conjunto de módulos liberados (é isto que vira menu)", () => {
  it("29. loja no plano básico vê o núcleo + o que o plano inclui, e nada mais", () => {
    const liberados = resolveAllowedModules(
      {
        tenant: loja(),
        plan: { slug: "basico", name: "Básico" },
        planModules: PLAN_MODULES,
        staff: { isSuperAdmin: false },
        agora: AGORA,
        config: { trialModuleSlugs: null },
      },
      MODULE_SLUGS
    );
    expect(liberados.sort()).toEqual(
      ["dashboard", "pedidos", "produtos", "configuracoes", "pagamentos", "entregas", "cupons"].sort()
    );
  });

  it("30. loja bloqueada fica só com configurações -- o menu encolhe, não trava", () => {
    const liberados = resolveAllowedModules(
      {
        tenant: loja({ subscriptionStatus: "canceled" }),
        plan: { slug: "basico", name: "Básico" },
        planModules: PLAN_MODULES,
        staff: { isSuperAdmin: false },
        agora: AGORA,
        config: { trialModuleSlugs: null },
      },
      MODULE_SLUGS
    );
    expect(liberados).toEqual(["configuracoes"]);
  });
});
