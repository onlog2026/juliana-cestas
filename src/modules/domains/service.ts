import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeHost } from "@/lib/tenant/resolve-host";

/**
 * DOMÍNIO PRÓPRIO DA LOJA — regras e leitura.
 *
 * ═══ O QUE ESTE MÓDULO É, E O QUE ELE NÃO É (leia antes de mexer) ═══
 * A lojista cadastra o domínio dela (ex. `www.lojadamaria.com.br`), a tela
 * mostra as instruções de DNS, e um botão confere se o DNS já está apontando
 * certo. É só isso. Especificamente, este módulo NUNCA:
 *
 *  - fala com a API da Vercel (não existe token de projeto configurado hoje);
 *  - emite ou renova certificado SSL;
 *  - faz o domínio da lojista servir a loja de verdade (isso depende do
 *    roteamento em `src/proxy.ts` reconhecer o host, que hoje só reconhece
 *    hosts de configuração -- ver `src/lib/tenant/resolve-host.ts`).
 *
 * A "verificação" deste módulo é uma consulta DNS direta (`node:dns`, em
 * `verify.ts`), comparando o que está publicado com o que foi instruído. Isso
 * prova uma coisa real e útil (a lojista configurou o DNS certo) sem inventar
 * uma integração que não existe. Por isso o status `verificado` NUNCA deve
 * virar a palavra "ativo" em nenhuma tela -- ver `STATUS_LABELS` abaixo.
 *
 * Quando o dono da plataforma tiver (1) o domínio da própria plataforma
 * configurado em `PLATFORM_DOMAIN`, (2) o plano Vercel Pro (exigido para
 * domínio customizado em projeto) e (3) um token de projeto da Vercel, o
 * próximo passo é escrever a chamada real à API da Vercel
 * (`POST /v10/projects/{id}/domains`) num arquivo novo -- este módulo já deixa
 * o cadastro, a validação e a checagem de DNS prontos para isso.
 */

// ── Domínios que não podem virar "domínio próprio de loja" ──────────────────

/** `*.vercel.app` é o domínio de deploy da própria Vercel -- nunca é de uma loja. */
const SUFIXOS_PROIBIDOS = [".vercel.app"];

/**
 * Alguns TLDs compostos comuns (segundo nível + país). Usado só para separar
 * "domínio raiz" de "subdomínio" sem precisar de uma lista pública de sufixos
 * completa (PSL) -- ver o comentário de `classifyDomainKind`.
 */
const TLDS_COMPOSTOS = new Set([
  "com.br", "net.br", "org.br", "app.br", "blog.br",
  "com.ar", "com.mx", "com.co", "com.pe", "com.uy", "com.py",
  "co.uk", "co.in", "com.au", "co.nz",
]);

/** O endereço A que a Vercel documenta para domínios raiz (apex). */
export const VERCEL_APEX_A_RECORD = "76.76.21.21";

export type DomainKind = "apex" | "subdomain";

export type DnsInstruction =
  | {
      tipo: "A";
      nome: string;
      host: string;
      valorEsperado: string;
      texto: string;
    }
  | {
      tipo: "CNAME";
      nome: string;
      host: string;
      /** `null` quando a plataforma ainda não tem domínio próprio configurado. */
      valorEsperado: string | null;
      texto: string;
    };

export type DomainStatus = "pendente" | "verificando" | "verificado" | "erro";

export type TenantDomain = {
  id: string;
  host: string;
  status: DomainStatus;
  dnsInstructions: DnsInstruction;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  errorMessage: string | null;
  createdAt: string | null;
};

/** Frase pronta, em português, para cada estado -- nunca diz "ativo". */
export const STATUS_LABELS: Record<DomainStatus, string> = {
  pendente: "Aguardando você configurar o DNS.",
  verificando: "Conferindo o DNS agora...",
  verificado:
    "DNS configurado certo. A ativação de verdade (o certificado e o domínio passar a responder pela loja) ainda depende do domínio da plataforma estar pronto -- avise o suporte quando quiser seguir com isso.",
  erro: "Erro ao verificar.",
};

// ── Validação e normalização ─────────────────────────────────────────────

/** Tira espaços, protocolo, caminho, porta e ponto final. Sempre minúsculo. */
export function normalizeDomainHost(raw: string | null | undefined): string {
  if (!raw) return "";
  let v = raw.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  v = v.split("/")[0];
  v = v.split(":")[0];
  v = v.replace(/\.$/, "");
  return v;
}

const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

/** O texto tem cara de nome de domínio de verdade (não IP, não "localhost")? */
export function isValidHostnameFormat(host: string): boolean {
  if (!host || host.length > 253) return false;
  if (IP_RE.test(host)) return false;
  const labels = host.split(".");
  if (labels.length < 2) return false; // exige pelo menos "algo.tld"
  return labels.every((label) => LABEL_RE.test(label));
}

/**
 * Este endereço é da própria plataforma (não pode virar domínio de uma loja)?
 *
 * Cobre: o domínio da plataforma e qualquer subdomínio dele, a URL pública
 * configurada hoje (`NEXT_PUBLIC_SITE_URL`) e qualquer `*.vercel.app`.
 */
export function isPlatformOrInternalHost(
  host: string,
  contexto: { platformDomain?: string; siteUrl?: string }
): boolean {
  const h = normalizeHost(host);
  if (!h) return true; // vazio nunca é um domínio válido de loja

  if (SUFIXOS_PROIBIDOS.some((sufixo) => h.endsWith(sufixo))) return true;

  const platform = normalizeHost(contexto.platformDomain ?? "");
  if (platform && (h === platform || h.endsWith(`.${platform}`))) return true;

  const site = normalizeHost(safeHostFromUrl(contexto.siteUrl ?? ""));
  if (site && h === site) return true;

  return false;
}

function safeHostFromUrl(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/**
 * "Domínio raiz" (apex, ex. `lojadamaria.com.br`) ou "subdomínio" (ex.
 * `www.lojadamaria.com.br`)?
 *
 * LIMITE CONHECIDO: isto NÃO é uma lista pública de sufixos (PSL) completa --
 * cobre os TLDs compostos mais comuns do Brasil e vizinhos
 * (`TLDS_COMPOSTOS`). Para um TLD composto fora dessa lista, um domínio raiz
 * de 3 níveis pode ser classificado como subdomínio por engano. Isso é
 * aceitável aqui porque o pior efeito é a lojista receber a instrução de
 * CNAME em vez de A -- e o próprio texto da instrução (`buildDnsInstructions`)
 * recomenda usar `www.<domínio>`, que é sempre subdomínio de verdade e nunca
 * cai nesse limite.
 */
export function classifyDomainKind(host: string): DomainKind {
  const labels = host.split(".");
  if (labels.length <= 2) return "apex";
  const ultimosDois = labels.slice(-2).join(".");
  if (labels.length === 3 && TLDS_COMPOSTOS.has(ultimosDois)) return "apex";
  return "subdomain";
}

/**
 * Monta as instruções de DNS para este host, confirmadas na documentação
 * oficial da Vercel (vercel.com/docs/domains, consultada nesta sessão):
 *
 *  - domínio raiz (apex) -> registro A apontando para `76.76.21.21`;
 *  - subdomínio (ex. `www`) -> registro CNAME.
 *
 * O ALVO do CNAME é o domínio da PLATAFORMA (`PLATFORM_DOMAIN`), não um valor
 * da Vercel -- porque hoje não existe integração real com a API da Vercel
 * (sem token de projeto, ver o comentário no topo do arquivo). Quando essa
 * integração existir, o alvo real e único-por-projeto que a Vercel exige
 * substitui isto. Se `PLATFORM_DOMAIN` ainda não estiver configurado (situação
 * de hoje), `valorEsperado` vem `null` e o texto explica isso com todas as
 * letras -- nunca inventamos um endereço.
 */
export function buildDnsInstructions(host: string, platformDomain: string): DnsInstruction {
  const kind = classifyDomainKind(host);

  if (kind === "apex") {
    return {
      tipo: "A",
      nome: "@",
      host,
      valorEsperado: VERCEL_APEX_A_RECORD,
      texto:
        `No painel do seu provedor de domínio, crie um registro do tipo A, com nome "@" ` +
        `(ou em branco, dependendo do provedor), apontando para ${VERCEL_APEX_A_RECORD}. ` +
        `Dica: muitos provedores facilitam a configuração de "www.${host}" em vez do domínio raiz -- ` +
        `se preferir, cadastre "www.${host}" aqui, que usa um registro CNAME (mais simples de manter).`,
    };
  }

  const nome = host.split(".")[0];
  const platform = normalizeHost(platformDomain);

  if (!platform) {
    return {
      tipo: "CNAME",
      nome,
      host,
      valorEsperado: null,
      texto:
        `A plataforma ainda não tem um domínio próprio configurado, então ainda não existe um ` +
        `endereço para apontar o CNAME. Assim que o dono da plataforma configurar isso, esta tela ` +
        `passa a mostrar o valor exato. Por enquanto, o cadastro do seu domínio fica salvo, aguardando.`,
    };
  }

  return {
    tipo: "CNAME",
    nome,
    host,
    valorEsperado: platform,
    texto:
      `No painel do seu provedor de domínio, crie um registro do tipo CNAME, com nome "${nome}" ` +
      `(alguns provedores pedem o endereço completo "${host}"), apontando para "${platform}".`,
  };
}

// ── Interpretação do resultado da consulta DNS (função pura, testável) ─────

export type ResultadoVerificacao = { status: "verificado" } | { status: "erro"; motivo: string };

/** Compara o(s) CNAME(s) publicados com o alvo esperado. Não faz rede -- recebe o resultado pronto. */
export function interpretarCname(resolvidos: string[], alvoEsperado: string): ResultadoVerificacao {
  const alvo = normalizeHost(alvoEsperado);
  if (resolvidos.some((r) => normalizeHost(r) === alvo)) return { status: "verificado" };
  if (resolvidos.length === 0) {
    return {
      status: "erro",
      motivo:
        "Não encontrei nenhum registro CNAME para esse endereço ainda. Confira se você já salvou a " +
        "configuração no painel do seu provedor de domínio -- a propagação pode levar algumas horas.",
    };
  }
  return {
    status: "erro",
    motivo: `O CNAME está apontando para "${resolvidos[0]}", mas o esperado é "${alvoEsperado}". Confira o valor cadastrado no seu provedor de domínio.`,
  };
}

/** Compara o(s) registro(s) A publicados com o IP esperado. */
export function interpretarA(resolvidos: string[], alvoEsperado: string): ResultadoVerificacao {
  if (resolvidos.includes(alvoEsperado)) return { status: "verificado" };
  if (resolvidos.length === 0) {
    return {
      status: "erro",
      motivo:
        "Não encontrei nenhum registro A para esse endereço ainda. Confira se você já salvou a " +
        "configuração no painel do seu provedor de domínio -- a propagação pode levar algumas horas.",
    };
  }
  return {
    status: "erro",
    motivo: `O registro A está apontando para "${resolvidos[0]}", mas o esperado é "${alvoEsperado}". Confira o valor cadastrado no seu provedor de domínio.`,
  };
}

// ── Leitura do banco ────────────────────────────────────────────────────────

type TenantDomainRow = {
  id: string;
  host: string;
  status: string;
  dns_instructions: DnsInstruction | null;
  verified_at: string | null;
  last_checked_at: string | null;
  error_message: string | null;
  created_at: string | null;
};

function mapRow(row: TenantDomainRow): TenantDomain {
  return {
    id: row.id,
    host: row.host,
    status: (row.status as DomainStatus) ?? "pendente",
    dnsInstructions: row.dns_instructions as DnsInstruction,
    verifiedAt: row.verified_at,
    lastCheckedAt: row.last_checked_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, host, status, dns_instructions, verified_at, last_checked_at, error_message, created_at";

/** Os domínios cadastrados por ESTA loja. */
export async function listTenantDomains(tenantId: string): Promise<TenantDomain[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_domains")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dominio] falha ao listar domínios:", error);
    return [];
  }
  return (data ?? []).map((r) => mapRow(r as TenantDomainRow));
}

/** Um domínio específico DESTA loja -- nunca de outra (`tenant_id` sempre no filtro). */
export async function getTenantDomain(tenantId: string, id: string): Promise<TenantDomain | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_domains")
    .select(COLUMNS)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as TenantDomainRow);
}

/**
 * Esse host já está em uso por QUALQUER loja (inclusive esta)?
 *
 * De propósito SEM filtro de `tenant_id`: a checagem de duplicidade é
 * global -- é assim que a mensagem amigável ("já está em uso por outra loja")
 * consegue existir antes de estourar a constraint UNIQUE do banco.
 */
export async function hostJaCadastrado(host: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("tenant_domains").select("id").eq("host", host).limit(1).maybeSingle();
  return Boolean(data);
}
