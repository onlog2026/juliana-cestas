import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Criação de loja pela PRÓPRIA PESSOA (auto-atendimento de `/cadastro`).
 *
 * Até aqui, loja só nascia por SQL ou pela mão do dono da plataforma. A partir
 * do momento em que qualquer visitante cria a própria loja, três coisas
 * deixam de ser detalhe e viram segurança:
 *
 * 1. **O formulário não decide dinheiro.** Nome, endereço, nicho, WhatsApp e
 *    cidade — só. Plano, status da assinatura, data de fim do teste e id da
 *    loja NUNCA são lidos do que o navegador manda. Quem decide o teste é o
 *    servidor, a partir de `saas_config.trial_days`. (O trigger
 *    `tenants_billing_guard` da migração 0025 é a segunda trava para isso —
 *    mas ele deixa o service role passar, justamente porque é o service role
 *    que grava o teste. Ou seja: aqui a trava tem que ser o código.)
 * 2. **Endereço é espaço de nomes compartilhado.** O slug vira caminho e, no
 *    futuro, subdomínio. Por isso passa por lista de palavras reservadas
 *    (`reserved_slugs`, migração 0029) e por checagem de uso — SEMPRE de novo
 *    no servidor. A validação do formulário é conforto, não é segurança.
 * 3. **Loja sem dono é pior que loja nenhuma.** São dois INSERTs em tabelas
 *    diferentes (`tenants` e `profiles`) e não existe transação entre eles
 *    pelo PostgREST. Se o segundo falhar, o primeiro é DESFEITO — ver o
 *    comentário na função. Loja órfã não aparece para ninguém, não pode ser
 *    reclamada, e ainda ocupa o endereço para sempre.
 *
 * As funções puras (`normalizeSlug`, `validateSlug`) ficam neste arquivo e têm
 * teste (`tests/unit/onboarding.test.ts`): são elas que decidem qual endereço
 * pode existir, e endereço errado é irreversível na prática (o link já foi
 * divulgado).
 */

/* ─────────────────────────── Regras do endereço ─────────────────────────── */

/** Mínimo de caracteres do endereço. Abaixo disso não sobra nome nenhum. */
export const SLUG_MIN = 3;
/** Máximo. Cabe em subdomínio e continua legível impresso num cartão. */
export const SLUG_MAX = 40;

/**
 * Espelho em código da tabela `reserved_slugs` (migração 0029).
 *
 * Existe para o servidor continuar recusando endereço perigoso mesmo que a
 * leitura da tabela falhe. A tabela é a lista que CRESCE sem deploy; esta é o
 * piso que nunca desaparece. As duas são somadas, nunca comparadas.
 */
export const RESERVED_SLUGS: readonly string[] = [
  "admin",
  "api",
  "auth",
  "super",
  "plataforma",
  "planos",
  "cadastro",
  "entrar",
  "conta",
  "checkout",
  "pedido",
  "produto",
  "categoria",
  "atendimento",
  "faq",
  "sobre",
  "redefinir-senha",
  "sitemap",
  "robots",
  "www",
  "app",
  "mail",
  "email",
  "cdn",
  "static",
  "assets",
  "dev",
  "staging",
  "status",
  "docs",
  "blog",
  "ajuda",
  "suporte",
  "contato",
  "termos",
  "privacidade",
  "precos",
  "loja",
  "lojas",
  "teste",
  "painel",
  "sistema",
  "null",
  "undefined",
  "juliana-cestas",
  "juliana-present",
];

/**
 * Formato aceito: blocos de letras minúsculas/números separados por UM hífen.
 *
 * Escrito assim (e não `[a-z0-9-]+`) porque este único padrão já recusa hífen
 * no começo, hífen no fim e hífen dobrado — os três casos que geram endereço
 * feio e, no fim, um endereço que a pessoa digita errado ao ditar por telefone.
 */
const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SlugProblem = "vazio" | "formato" | "curto" | "longo" | "reservado";

export type SlugCheck = { ok: true } | { ok: false; motivo: SlugProblem; mensagem: string };

/**
 * Transforma o que a pessoa digitou no endereço que o sistema usaria.
 *
 * "Cestas da Juliana ✿" → "cestas-da-juliana". Tira acento de verdade
 * (decompõe e joga fora o sinal), então "café" vira "cafe" e não "caf".
 *
 * É a ÚNICA função que produz endereço. A tela mostra o resultado dela antes
 * de gravar — assim ninguém descobre depois que o endereço ficou diferente do
 * que digitou.
 */
export function normalizeSlug(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    // Remove os sinais diacríticos que a decomposição separou (acento, til,
    // cedilha). O "c" do "ç" sobrevive; só o rabinho cai.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    // O corte por tamanho pode ter deixado um hífen solto no fim.
    .replace(/-+$/g, "");
}

/**
 * Diz se um endereço PODE existir. Recebe a lista de reservados por parâmetro
 * (e não lê nada) para continuar pura e testável: o servidor passa a lista do
 * código somada à do banco.
 *
 * A ordem das checagens importa para a mensagem sair útil: primeiro formato
 * (é o erro que a pessoa consegue corrigir olhando), depois tamanho, por fim
 * reservado.
 */
export function validateSlug(slug: string | null | undefined, reservados: readonly string[]): SlugCheck {
  const valor = (slug ?? "").trim();

  if (!valor) {
    return { ok: false, motivo: "vazio", mensagem: "Escolha o endereço da sua loja." };
  }

  if (!FORMATO_SLUG.test(valor)) {
    return {
      ok: false,
      motivo: "formato",
      mensagem:
        "Use só letras minúsculas, números e hífen. Sem acento, sem espaço e sem hífen no começo, no fim ou repetido.",
    };
  }

  if (valor.length < SLUG_MIN) {
    return {
      ok: false,
      motivo: "curto",
      mensagem: `O endereço precisa ter pelo menos ${SLUG_MIN} caracteres.`,
    };
  }

  if (valor.length > SLUG_MAX) {
    return {
      ok: false,
      motivo: "longo",
      mensagem: `O endereço pode ter no máximo ${SLUG_MAX} caracteres.`,
    };
  }

  const reservado = reservados.some((r) => (r ?? "").trim().toLowerCase() === valor);
  if (reservado) {
    return {
      ok: false,
      motivo: "reservado",
      mensagem: "Esse endereço é reservado pelo sistema. Escolha outro.",
    };
  }

  return { ok: true };
}

/**
 * Só dígitos, com o 55 na frente quando a pessoa digitou o número brasileiro
 * sem o país. É o mesmo formato que já está gravado para a loja fundadora
 * (`5561998894889`, migração 0006) — WhatsApp em dois formatos na mesma coluna
 * quebra o link `wa.me` de metade das lojas.
 */
export function normalizeWhatsapp(texto: string | null | undefined): string {
  const digitos = (texto ?? "").replace(/\D+/g, "");
  if (!digitos) return "";
  if (digitos.length >= 10 && digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

/** Um WhatsApp que dá para usar: DDD + número, com ou sem o 55. */
export function isWhatsappValido(texto: string | null | undefined): boolean {
  const normalizado = normalizeWhatsapp(texto);
  return normalizado.length >= 12 && normalizado.length <= 13;
}

/* ──────────────────────────── Criação da loja ───────────────────────────── */

/**
 * O que a pessoa preenche. Nada além disto entra — repare que não existe
 * `tenantId`, `plano`, `status` nem `trialEndsAt` neste tipo, de propósito.
 */
export type NewStoreInput = {
  nome: string;
  slug: string;
  nicho: string;
  whatsapp: string;
  cidade: string;
};

export type CreatedStore = {
  tenantId: string;
  slug: string;
  nome: string;
  /** ISO. `null` só se o banco devolver a coluna vazia. */
  trialEndsAt: string | null;
  /** `true` quando a pessoa JÁ tinha loja e nada foi criado agora. */
  jaExistia: boolean;
};

export type CreateStoreResult =
  | { ok: true; store: CreatedStore }
  | { ok: false; error: string; campo?: "slug" | "nome" | "whatsapp" | "cidade" | "nicho" };

/** Padrão de dias de teste quando `saas_config` não responde (mesmo da migração 0026). */
const TRIAL_DAYS_PADRAO = 2;

/** Lista de reservados do banco somada à do código. Falha de leitura não abre a porta. */
async function carregarReservados(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data, error } = await admin.from("reserved_slugs").select("slug");
  if (error) {
    // A lista do código continua valendo: recusar demais é aceitável aqui,
    // aceitar de menos não é.
    console.error("[onboarding] não consegui ler reserved_slugs, usando só a lista do código:", error);
    return [...RESERVED_SLUGS];
  }
  const doBanco = (data ?? []).map((r) => String((r as { slug: string }).slug));
  return [...RESERVED_SLUGS, ...doBanco];
}

/** Dias de teste configurados pelo dono da plataforma. Nunca vem do formulário. */
async function carregarDiasDeTeste(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data, error } = await admin.from("saas_config").select("trial_days").eq("id", 1).maybeSingle();
  if (error || !data) {
    console.error("[onboarding] não consegui ler saas_config.trial_days, usando o padrão:", error);
    return TRIAL_DAYS_PADRAO;
  }
  const dias = Number((data as { trial_days: number }).trial_days);
  return Number.isFinite(dias) && dias >= 0 ? dias : TRIAL_DAYS_PADRAO;
}

/**
 * Cria a loja da pessoa. **Inteiramente no servidor, com service role.**
 *
 * Idempotente por desenho: quem já tem loja recebe a loja que já tem, com
 * `jaExistia: true`. Duplo clique, botão de voltar do navegador e reenvio do
 * formulário não criam uma segunda loja — e não devolvem erro, porque para a
 * pessoa o resultado é o mesmo: ela tem uma loja.
 *
 * @param userId  id do usuário no Supabase Auth. Vem de `auth.getUser()` no
 *                servidor — NUNCA de um campo do formulário.
 */
export async function createStoreForUser(userId: string, dados: NewStoreInput): Promise<CreateStoreResult> {
  if (!userId) return { ok: false, error: "Sua sessão expirou. Entre de novo para continuar." };

  const admin = createAdminClient();

  /* 1. Já tem loja? Então nada é criado. -------------------------------- */
  const { data: perfil, error: erroPerfil } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (erroPerfil) {
    console.error("[onboarding] falha ao verificar se a pessoa já tem loja:", erroPerfil);
    return { ok: false, error: "Não consegui verificar sua conta agora. Tente de novo em instantes." };
  }

  if (perfil?.tenant_id) {
    const { data: lojaAtual, error: erroLojaAtual } = await admin
      .from("tenants")
      .select("id, slug, name, trial_ends_at")
      .eq("id", perfil.tenant_id)
      .maybeSingle();

    if (erroLojaAtual) {
      console.error("[onboarding] falha ao ler a loja que a pessoa já tem:", erroLojaAtual);
      return { ok: false, error: "Não consegui carregar a sua loja agora. Tente de novo em instantes." };
    }

    if (lojaAtual) {
      return {
        ok: true,
        store: {
          tenantId: lojaAtual.id as string,
          slug: lojaAtual.slug as string,
          nome: lojaAtual.name as string,
          trialEndsAt: (lojaAtual.trial_ends_at as string | null) ?? null,
          jaExistia: true,
        },
      };
    }
    // Perfil apontando para loja que não existe mais: caso raro (loja apagada
    // à mão). Deixar seguir criaria um segundo perfil para o mesmo usuário e o
    // INSERT abaixo falharia na chave primária. Melhor dizer a verdade.
    console.error("[onboarding] perfil aponta para loja inexistente:", perfil.tenant_id);
    return { ok: false, error: "Sua conta está ligada a uma loja que não existe mais. Fale com o suporte." };
  }

  /* 2. Endereço: valida DE NOVO aqui, do zero. -------------------------- */
  const slug = normalizeSlug(dados.slug);
  const reservados = await carregarReservados(admin);
  const checagem = validateSlug(slug, reservados);
  if (!checagem.ok) return { ok: false, error: checagem.mensagem, campo: "slug" };

  const nome = (dados.nome ?? "").trim();
  if (nome.length < 2) return { ok: false, error: "Escreva o nome da sua loja.", campo: "nome" };

  const whatsapp = normalizeWhatsapp(dados.whatsapp);
  if (!isWhatsappValido(whatsapp)) {
    return { ok: false, error: "Escreva o WhatsApp com DDD. Exemplo: (61) 99999-9999.", campo: "whatsapp" };
  }

  const cidade = (dados.cidade ?? "").trim();
  if (cidade.length < 2) return { ok: false, error: "Escreva a cidade da sua loja.", campo: "cidade" };

  // Nicho é texto descritivo (aparece no painel da plataforma para o dono
  // entender que tipo de loja entrou). Não libera nem trava nada, por isso não
  // é lista fechada — lista fechada aqui só criaria divergência entre o que a
  // tela oferece e o que o servidor aceita.
  const nicho = (dados.nicho ?? "").trim().slice(0, 40);
  if (nicho.length < 2) return { ok: false, error: "Escolha o tipo da sua loja.", campo: "nicho" };

  const { data: ocupado, error: erroOcupado } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (erroOcupado) {
    console.error("[onboarding] falha ao conferir se o endereço está livre:", erroOcupado);
    return { ok: false, error: "Não consegui conferir o endereço agora. Tente de novo em instantes." };
  }
  if (ocupado) {
    return { ok: false, error: "Esse endereço já é de outra loja. Escolha outro.", campo: "slug" };
  }

  /* 3. E-mail do dono: sai do Auth, não do formulário. ------------------- */
  let ownerEmail: string | null = null;
  const { data: authUser, error: erroAuth } = await admin.auth.admin.getUserById(userId);
  if (erroAuth || !authUser?.user) {
    console.error("[onboarding] usuário não encontrado no Auth:", erroAuth);
    return { ok: false, error: "Sua sessão expirou. Entre de novo para continuar." };
  }
  ownerEmail = authUser.user.email ?? null;
  const nomeDaPessoa =
    (authUser.user.user_metadata?.name as string | undefined)?.trim() ||
    (authUser.user.user_metadata?.full_name as string | undefined)?.trim() ||
    null;

  /* 4. Cria a loja em TESTE. Os valores de cobrança são decididos aqui. -- */
  const dias = await carregarDiasDeTeste(admin);
  const agora = new Date();
  const fimDoTeste = new Date(agora.getTime() + dias * 86400000);

  const { data: lojaCriada, error: erroLoja } = await admin
    .from("tenants")
    .insert({
      slug,
      name: nome,
      whatsapp,
      niche: nicho,
      owner_email: ownerEmail,
      status: "active",
      // Nasce em teste, sem plano. Plano só existe depois de pagamento
      // confirmado pelo webhook — nunca no cadastro.
      subscription_status: "trialing",
      subscription_plan: null,
      trial_ends_at: fimDoTeste.toISOString(),
    })
    .select("id, slug, name, trial_ends_at")
    .maybeSingle();

  if (erroLoja || !lojaCriada) {
    // 23505 = chave única. Alguém pegou o mesmo endereço entre a conferência
    // acima e este INSERT (duas pessoas cadastrando ao mesmo tempo). O banco é
    // o juiz; a conferência anterior serve só para dar mensagem melhor antes.
    const codigo = (erroLoja as { code?: string } | null)?.code;
    if (codigo === "23505") {
      return { ok: false, error: "Esse endereço acabou de ser levado. Escolha outro.", campo: "slug" };
    }
    console.error("[onboarding] falha ao criar a loja:", erroLoja);
    return { ok: false, error: "Não consegui criar sua loja agora. Tente de novo em instantes." };
  }

  const tenantId = lojaCriada.id as string;

  /* 5. A pessoa vira dona da loja. -------------------------------------- */
  //
  // Se ISTO falhar, a loja criada no passo 4 é APAGADA. É a única forma de não
  // deixar loja órfã: uma loja sem perfil não aparece para ninguém, ninguém
  // consegue reivindicar, e ainda assim ocupa o endereço para sempre. Como o
  // tenant acabou de nascer (nenhum pedido, nenhum produto, nenhuma outra
  // linha aponta para ele), apagar é seguro. O `delete` é restrito ao id
  // recém-criado — nunca a um id vindo de fora.
  const { data: perfilCriado, error: erroPerfilNovo } = await admin
    .from("profiles")
    .insert({ id: userId, tenant_id: tenantId, role: "admin", name: nomeDaPessoa ?? nome })
    .select("id")
    .maybeSingle();

  if (erroPerfilNovo || !perfilCriado) {
    console.error("[onboarding] falha ao tornar a pessoa dona da loja — desfazendo a loja:", erroPerfilNovo);
    const { error: erroDesfazer } = await admin.from("tenants").delete().eq("id", tenantId);
    if (erroDesfazer) {
      // Não dá para esconder: sobrou uma loja sem dono. Fica registrado com o
      // id, para o dono da plataforma limpar pela tela de lojas.
      console.error("[onboarding] LOJA ÓRFÃ, precisa de limpeza manual:", tenantId, erroDesfazer);
      await admin.from("app_errors").insert({
        tenant_id: null,
        module: "cadastro",
        action: "loja_orfa",
        level: "critical",
        message: `Loja ${slug} criada sem dono e não pôde ser removida automaticamente.`,
        detail: { tenantId, userId, slug },
      });
    }
    return { ok: false, error: "Não consegui finalizar o cadastro. Tente de novo em instantes." };
  }

  /* 6. Dados da loja que a vitrine usa. Falha aqui NÃO desfaz nada. ------ */
  //
  // A loja já existe e já tem dona: a partir daqui, qualquer falha é coisa que
  // ela mesma completa no painel, em Configurações. Desfazer a loja por causa
  // de um campo de endereço seria trocar um problema pequeno por um grande.
  const { error: erroPerfilLoja } = await admin.from("store_profile").upsert(
    {
      tenant_id: tenantId,
      business_name: nome,
      city: cidade,
      phone: whatsapp,
      email: ownerEmail,
    },
    { onConflict: "tenant_id" }
  );
  if (erroPerfilLoja) {
    console.error("[onboarding] loja criada, mas os dados do perfil não gravaram:", erroPerfilLoja);
  }

  const { error: erroAuditoria } = await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_email: ownerEmail,
    action: "loja_criada_pelo_cliente",
    target: slug,
    before: null,
    after: { slug, nome, nicho, cidade, trial_ends_at: fimDoTeste.toISOString(), trial_days: dias },
  });
  if (erroAuditoria) console.error("[onboarding] falha ao gravar auditoria do cadastro:", erroAuditoria);

  return {
    ok: true,
    store: {
      tenantId,
      slug: lojaCriada.slug as string,
      nome: lojaCriada.name as string,
      trialEndsAt: (lojaCriada.trial_ends_at as string | null) ?? null,
      jaExistia: false,
    },
  };
}

/* ─────────────────────── Para onde a pessoa vai depois ──────────────────── */

/**
 * O endereço do painel de uma loja. **Regra única** — a tela de cadastro, a
 * tela de login e a Server Action usam esta função, nunca uma cópia.
 *
 * `null` quer dizer "esta loja ainda não tem como ser aberta" e a tela precisa
 * DIZER isso. Acontece quando `PLATFORM_DOMAIN` não está configurada: sem ela,
 * `/admin` neste mesmo domínio resolve sempre para a loja legada
 * (`src/lib/tenant/context.ts`), então quem acabou de criar a loja cairia numa
 * tela de login que nunca aceita a conta dele.
 *
 * @param ehLojaLegada  a loja fundadora, a única que hoje responde por
 *                      `/admin` sem domínio configurado.
 */
export function painelUrlDaLoja(
  slug: string,
  ehLojaLegada: boolean,
  platformDomain: string
): string | null {
  const dominio = (platformDomain ?? "").trim();
  if (dominio) return `https://${slug}.${dominio}/admin`;
  if (ehLojaLegada) return "/admin";
  return null;
}

export type LojaDaPessoa = {
  tenantId: string;
  slug: string;
  nome: string;
  trialEndsAt: string | null;
};

/** A loja de quem está logado, ou `null` se ainda não tem nenhuma. */
export async function getStoreOfUser(userId: string): Promise<LojaDaPessoa | null> {
  if (!userId) return null;
  const admin = createAdminClient();

  const { data: perfil, error } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[onboarding] falha ao ler o perfil da pessoa:", error);
    return null;
  }
  if (!perfil?.tenant_id) return null;

  const { data: loja, error: erroLoja } = await admin
    .from("tenants")
    .select("id, slug, name, trial_ends_at")
    .eq("id", perfil.tenant_id)
    .maybeSingle();

  if (erroLoja || !loja) {
    console.error("[onboarding] perfil sem loja correspondente:", erroLoja);
    return null;
  }

  return {
    tenantId: loja.id as string,
    slug: loja.slug as string,
    nome: loja.name as string,
    trialEndsAt: (loja.trial_ends_at as string | null) ?? null,
  };
}
