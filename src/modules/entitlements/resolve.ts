/**
 * A REGRA de direito de acesso por plano -- função PURA.
 *
 * Não lê banco, não lê `headers()`, não lê relógio do sistema: recebe TUDO por
 * parâmetro, inclusive o instante `agora`. É isso que a torna testável de
 * verdade (tests/unit/entitlements.test.ts) -- e o motivo de a regra morar aqui
 * e não dentro do serviço que consulta o banco.
 *
 * O que ela responde: "esta loja, com este plano, neste instante, pode usar
 * este módulo?" -- e POR QUÊ, sempre, mesmo quando libera.
 *
 * A ordem das decisões é deliberada e cada passo está comentado com o porquê.
 * Ordem errada aqui não dá erro nenhum: só dá acesso errado, em silêncio.
 */

import {
  FOUNDER_PLAN_SLUG,
  isAlwaysAvailable,
  isCoreModule,
  isKnownModule,
} from "@/lib/modules/registry";

// ── Tipos de entrada ────────────────────────────────────────────────────────

/** Situação de cobrança da loja, exatamente como as colunas da migração 0025. */
export type TenantBilling = {
  /** `tenants.subscription_plan` (slug do plano contratado). */
  subscriptionPlan: string | null;
  /** `tenants.subscription_status`. */
  subscriptionStatus: string | null;
  /** `tenants.trial_ends_at`. É a DATA que manda -- nunca o texto do status. */
  trialEndsAt: string | Date | null;
  /** `tenants.paid_until`. */
  paidUntil: string | Date | null;
  /** `tenants.bonus_until` -- cortesia dada pelo dono da plataforma. */
  bonusUntil: string | Date | null;
  /** `tenants.bonus_plan_slug` -- a cortesia pode ser de um plano SUPERIOR. */
  bonusPlanSlug: string | null;
  /** `tenants.granted_modules` -- módulos soltos liberados por voucher. */
  grantedModules: string[] | null;
  /** `tenants.granted_modules_until` -- par indivisível com o campo acima. */
  grantedModulesUntil: string | Date | null;
};

export type PlanModuleStatus = "included" | "addon" | "excluded";

/** Uma linha de `plan_modules`. */
export type PlanModuleRule = {
  moduleSlug: string;
  status: PlanModuleStatus;
};

/** O plano contratado, do jeito mínimo que a regra precisa conhecer. */
export type PlanRef = {
  slug: string;
  name?: string | null;
} | null;

/** Quem está pedindo. Só uma informação importa aqui. */
export type StaffRef = {
  isSuperAdmin: boolean;
} | null;

/** O pedaço de `saas_config` que a regra usa. */
export type EntitlementConfig = {
  /**
   * `null` = durante o teste a loja vê TUDO (padrão do sistema).
   * Lista = durante o teste a loja vê SÓ estes módulos.
   * A diferença entre `null` e lista vazia é intencional: lista vazia quer
   * dizer "o teste não libera nada além do núcleo".
   */
  trialModuleSlugs: string[] | null;
} | null;

export type ResolveModuleAccessInput = {
  tenant: TenantBilling;
  /** Plano contratado (linha de `subscription_plans`), ou `null` se não existir. */
  plan: PlanRef;
  /**
   * Regras plano × módulo, INDEXADAS PELO SLUG DO PLANO.
   *
   * É um mapa e não uma lista porque a cortesia (passo 4) pode apontar para um
   * plano diferente do contratado -- e a regra precisa poder olhar as regras
   * daquele outro plano sem voltar ao banco.
   */
  planModules: Record<string, PlanModuleRule[]>;
  staff: StaffRef;
  /** Slug do módulo perguntado. */
  module: string;
  /** O instante da decisão. Sempre injetado: é o que torna o teste possível. */
  agora: Date;
  config?: EntitlementConfig;
};

export type ModuleAccess = {
  allowed: boolean;
  /**
   * Código curto do motivo (não é texto de tela). Serve para log, teste e para
   * a página de oferta explicar o caso certo. Nunca é vazio, nem quando libera.
   */
  reason: string;
};

/**
 * Situação da conta, do ponto de vista de quem usa o painel.
 *  - `ok`            — em dia (ou fundadora, ou em cortesia).
 *  - `teste`         — teste grátis rodando.
 *  - `teste_vencido` — o teste acabou e não virou assinatura: BLOQUEIA.
 *  - `atrasado`      — pagamento pendente/atrasado: avisa, mas NÃO bloqueia.
 *  - `bloqueado`     — assinatura cancelada/inativa: BLOQUEIA.
 */
export type AccountState = "ok" | "teste" | "teste_vencido" | "atrasado" | "bloqueado";

// ── Datas ───────────────────────────────────────────────────────────────────

/** Converte para Date. Texto inválido vira `null` (nunca "Invalid Date"). */
function paraData(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A data existe E está no futuro?
 *
 * `null` responde `false` -- de propósito. Data ausente não é "vale para
 * sempre": é "não há prazo válido", e prazo ausente não libera nada.
 */
function noFuturo(valor: string | Date | null | undefined, agora: Date): boolean {
  const d = paraData(valor);
  if (!d) return false;
  return d.getTime() > agora.getTime();
}

// ── Estado da conta ─────────────────────────────────────────────────────────

/**
 * Em que situação a conta está NESTE instante.
 *
 * A regra de ouro: **a data manda, o texto do status não.** No Agentop, uma
 * loja com `subscription_status = 'trialing'` e `trial_ends_at` vencido há
 * meses continuava com acesso total, porque o código olhava só o texto. Aqui,
 * `trialing` com data vencida é `teste_vencido` -- e `teste_vencido` bloqueia.
 */
export function accountState(tenant: TenantBilling, agora: Date): AccountState {
  // A loja fundadora (a primeira da plataforma) nunca sente nada disso. Ela
  // paga com pioneirismo, não com boleto.
  if (tenant.subscriptionPlan === FOUNDER_PLAN_SLUG) return "ok";

  // Cortesia do dono da plataforma vale enquanto durar, aconteça o que
  // acontecer com a assinatura. É exatamente para isso que ela existe.
  if (noFuturo(tenant.bonusUntil, agora)) return "ok";

  const status = (tenant.subscriptionStatus ?? "").trim().toLowerCase();

  if (status === "trialing") {
    if (noFuturo(tenant.trialEndsAt, agora)) return "teste";
    // Teste sem data marcada: conta nova que ainda não teve o prazo calculado.
    // Tratar como teste ativo é errar liberando -- e errar liberando é o lado
    // certo de errar quando a alternativa é trancar uma lojista de fora.
    if (!paraData(tenant.trialEndsAt)) return "teste";
    return "teste_vencido";
  }

  // Cancelada ou inativa: acabou mesmo.
  if (status === "canceled" || status === "inactive") return "bloqueado";

  // Atrasada / aguardando confirmação do pagamento: avisa, não tranca. Evento
  // de gateway chega fora de ordem (a spec registra um `OVERDUE` de assinatura
  // já substituída que bloqueou cliente em dia) -- bloquear aqui puniria quem
  // pagou por um problema de ordem de mensagem.
  if (status === "overdue" || status === "pending") return "atrasado";

  if (status === "active") {
    // Ativa com vigência vencida: provavelmente o webhook de renovação ainda
    // não chegou. Avisa, não tranca.
    const pago = paraData(tenant.paidUntil);
    if (pago && !noFuturo(pago, agora)) return "atrasado";
    return "ok";
  }

  // Status desconhecido (coluna nova, dado antigo, migração no meio): trata
  // como em dia. Um valor que o código não conhece não pode virar bloqueio.
  return "ok";
}

/** Os dois estados que fecham a porta. */
export function estadoBloqueia(estado: AccountState): boolean {
  return estado === "bloqueado" || estado === "teste_vencido";
}

// ── A regra ─────────────────────────────────────────────────────────────────

export function resolveModuleAccess(input: ResolveModuleAccessInput): ModuleAccess {
  const { tenant, plan, planModules, staff, agora, config } = input;
  const modulo = (input.module ?? "").trim().toLowerCase();
  const estado = accountState(tenant, agora);

  // ── Passo 2 (adiantado) — super admin ───────────────────────────────────
  // Vem antes até do bloqueio: o dono da plataforma precisa conseguir entrar
  // numa loja bloqueada justamente para desbloqueá-la. Se o bloqueio viesse
  // primeiro, o único jeito de resolver seria pelo banco.
  if (staff?.isSuperAdmin) return { allowed: true, reason: "super_admin" };

  // ── Passo 2b — plano fundadora ──────────────────────────────────────────
  // A loja da Juliana está em produção com clientes reais. Cinto E suspensório:
  // mesmo que `plan_modules` venha incompleto, mesmo que a assinatura esteja
  // com qualquer status, ela libera tudo e nunca bloqueia. Ela não pode sentir
  // absolutamente nada deste sistema.
  if (tenant.subscriptionPlan === FOUNDER_PLAN_SLUG) {
    return { allowed: true, reason: "plano_fundadora" };
  }

  // ── Passo 1 — conta bloqueada ───────────────────────────────────────────
  // Assinatura vencida sem cortesia fecha o painel, MENOS configurações e
  // assinatura: são as duas telas por onde se volta a pagar. Trancar essas
  // duas seria trancar a saída de emergência.
  if (estadoBloqueia(estado)) {
    if (isAlwaysAvailable(modulo)) {
      return { allowed: true, reason: "excecao_conta_bloqueada" };
    }
    return { allowed: false, reason: estado === "teste_vencido" ? "teste_vencido" : "conta_bloqueada" };
  }

  // Módulo que o código não conhece nunca é liberado por engano. É o inverso
  // do Agentop, onde o gate era allowlist manual e "módulo novo nascia sem
  // gate" -- aqui módulo desconhecido nasce fechado. (Ele também nunca aparece
  // no menu, porque o menu só é montado a partir deste mesmo registro.)
  if (!isKnownModule(modulo)) {
    if (isAlwaysAvailable(modulo)) return { allowed: true, reason: "sempre_disponivel" };
    return { allowed: false, reason: "modulo_desconhecido" };
  }

  // ── Passo 3 — núcleo ────────────────────────────────────────────────────
  // Sem estes cinco a palavra "loja" não significa nada. Nenhum plano os tira.
  if (isCoreModule(modulo)) return { allowed: true, reason: "modulo_do_nucleo" };

  // ── Passo 4 — cortesia ──────────────────────────────────────────────────
  // Cortesia ativa manda o plano dela valer no lugar do contratado (pode ser um
  // plano SUPERIOR: é assim que o dono libera uma loja para testar o plano
  // maior sem cobrar). Cortesia vencida não vale nada -- a data manda.
  const cortesiaAtiva = noFuturo(tenant.bonusUntil, agora);
  const planoContratado = plan?.slug ?? tenant.subscriptionPlan ?? null;
  const planoEfetivo = cortesiaAtiva && tenant.bonusPlanSlug ? tenant.bonusPlanSlug : planoContratado;

  // ── Passo 5 — teste ativo ───────────────────────────────────────────────
  // Só é teste ativo quando o STATUS diz `trialing` E a DATA ainda não passou
  // (`accountState` já resolveu isso). O que o teste libera vem de
  // `saas_config.trial_module_slugs`: `null` = libera tudo.
  if (estado === "teste") {
    const lista = config?.trialModuleSlugs ?? null;
    if (lista === null) return { allowed: true, reason: "teste_libera_tudo" };
    if (lista.includes(modulo)) return { allowed: true, reason: "teste_libera_este_modulo" };
    // Fora da lista do teste: NÃO nega aqui. Ainda pode estar liberado por
    // voucher (passo 6) ou pelo plano já contratado (passo 7).
  }

  // ── Passo 6 — módulo liberado por voucher, com prazo ────────────────────
  // As duas colunas são um par indivisível: lista sem prazo no futuro não
  // libera nada. Ler uma sem a outra foi o que, no Agentop, deu acesso eterno a
  // uma cortesia de 30 dias.
  const soltos = tenant.grantedModules ?? [];
  if (soltos.includes(modulo) && noFuturo(tenant.grantedModulesUntil, agora)) {
    return { allowed: true, reason: "liberado_por_cortesia_de_modulo" };
  }

  // ── Passo 7 — o plano ───────────────────────────────────────────────────
  if (!planoEfetivo) return { allowed: false, reason: "sem_plano" };

  const regras = planModules[planoEfetivo];
  if (!regras) {
    // Plano gravado na loja que não existe na tabela de planos (slug digitado
    // errado, plano apagado). Não inventa nada: nega e diz exatamente isso, para
    // a tela poder mostrar "seu plano não foi encontrado" em vez de mentir
    // "não incluído".
    return { allowed: false, reason: "plano_nao_encontrado" };
  }

  const regra = regras.find((r) => r.moduleSlug === modulo);
  if (regra?.status === "included") {
    return { allowed: true, reason: cortesiaAtiva ? "incluso_no_plano_da_cortesia" : "incluso_no_plano" };
  }
  if (regra?.status === "addon") {
    // Add-on é coisa que se vende à parte: existe no plano, mas não contratada.
    return { allowed: false, reason: "addon_nao_contratado" };
  }

  // ── Passo 8 — o resto ───────────────────────────────────────────────────
  return { allowed: false, reason: "nao_incluso_no_plano" };
}

/**
 * Roda a regra para uma lista de módulos de uma vez.
 * É o que o serviço usa para montar o conjunto liberado da loja.
 */
export function resolveAllowedModules(
  input: Omit<ResolveModuleAccessInput, "module">,
  modules: readonly string[]
): string[] {
  return modules.filter((slug) => resolveModuleAccess({ ...input, module: slug }).allowed);
}

/**
 * Quantos dias inteiros faltam até a data. Usado no aviso "seu teste termina em
 * N dias". Nunca devolve negativo: acabou é 0.
 */
export function diasAte(data: string | Date | null | undefined, agora: Date): number | null {
  const d = paraData(data);
  if (!d) return null;
  const ms = d.getTime() - agora.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
