import "server-only";
import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { tipoDeHost, listaDeHostsDaPlataforma, type TipoDeHost } from "@/lib/tenant/host-kind";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { getPublicPlansPage } from "@/modules/platform/plans-public";
import { MODELOS } from "@/modules/platform/modelos-catalog";
import { RECURSOS } from "@/modules/platform/recursos";
import { SOLUCOES } from "@/modules/platform/solucoes";

/**
 * SEO, manifesto e texto para IA do SITE DA PLATAFORMA.
 * A decisão "este endereço é da plataforma?" fica em robots/sitemap/manifest/llms (via `tipoDoHostAtual`);
 * o layout só usa variáveis de ambiente (`urlBaseDaPlataformaPorEnv`) para não tornar páginas dinâmicas.
 */

// Cores padrão do escopo da plataforma (tinta e papel).
export const COR_TINTA = "#14110f";
export const COR_PAPEL = "#f7f3ec";
export const COR_ACENTO = "#e8a33d";

const semBarraFinal = (u: string) => u.trim().replace(/\/+$/, "");

/** Endereço que chegou na requisição (cabeçalho `x-forwarded-host` ou `host`). Fora de requisição, "". */
export async function hostDaRequisicao(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  } catch {
    return "";
  }
}

export async function tipoDoHostAtual(): Promise<{ tipo: TipoDeHost; host: string }> {
  const host = await hostDaRequisicao();
  return { tipo: tipoDeHost(host, process.env.PLATFORM_HOSTS), host };
}

/** Só variáveis de ambiente (usado pelo layout, que não pode ler headers). */
export function urlBaseDaPlataformaPorEnv(): string {
  const publica = semBarraFinal(process.env.PLATFORM_PUBLIC_URL ?? "");
  if (publica) return publica;
  const [primeiro] = (process.env.PLATFORM_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  if (primeiro) return `https://${primeiro}`;
  return "http://localhost:3000";
}

/**
 * URL base (sem barra no fim): o host da requisição quando ele é da plataforma (como veio, com ou sem www),
 * senão `PLATFORM_PUBLIC_URL`, senão o primeiro de `PLATFORM_HOSTS`, senão http://localhost:3000.
 */
export function urlBaseDaPlataforma(host?: string | null): string {
  const h = (host ?? "").trim();
  if (h && tipoDeHost(h, process.env.PLATFORM_HOSTS) === "plataforma") return `https://${h.toLowerCase()}`;
  return urlBaseDaPlataformaPorEnv();
}

/** Há ao menos um endereço de plataforma configurado? Sem isso o site é só preview/local. */
export function plataformaTemEnderecoConfigurado(): boolean {
  return listaDeHostsDaPlataforma(process.env.PLATFORM_HOSTS).length > 0;
}

export async function nomeDaMarca(): Promise<string> {
  try {
    const { branding } = await getAllPlatformContent();
    return branding.wordmark?.trim() || PLATFORM_DEFAULTS.branding.wordmark;
  } catch (e) {
    console.error("[seo-plataforma] marca caiu no padrão:", e);
    return PLATFORM_DEFAULTS.branding.wordmark;
  }
}

/* ------------------------------------------------------------------ sitemap / robots */

const COM_SLUG = (x: unknown): { slug: string }[] =>
  (Array.isArray(x) ? x : []).filter(
    (i): i is { slug: string } => !!i && typeof (i as { slug?: unknown }).slug === "string",
  );

export function caminhosDoSitemapDaPlataforma(): { path: string; priority: number }[] {
  return [
    { path: "", priority: 1 },
    { path: "/recursos", priority: 0.9 },
    ...COM_SLUG(RECURSOS).map((r) => ({ path: `/recursos/${r.slug}`, priority: 0.8 })),
    { path: "/solucoes", priority: 0.9 },
    ...COM_SLUG(SOLUCOES).map((s) => ({ path: `/solucoes/${s.slug}`, priority: 0.8 })),
    { path: "/planos", priority: 0.9 },
    { path: "/modelos", priority: 0.8 },
    ...MODELOS.map((m) => ({ path: `/modelos/${m.key}`, priority: 0.6 })),
    { path: "/cadastro", priority: 0.7 },
  ];
}

export function sitemapDaPlataforma(base: string): MetadataRoute.Sitemap {
  return caminhosDoSitemapDaPlataforma().map(({ path, priority }) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority,
  }));
}

export function robotsDaPlataforma(base: string): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/super", "/admin", "/api", "/entrar"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

/* ------------------------------------------------------------------ manifesto e ícone */

export async function manifestoDaPlataforma(): Promise<MetadataRoute.Manifest> {
  const nome = await nomeDaMarca();
  return {
    name: nome,
    short_name: nome.length > 12 ? nome.split(/\s+/)[0] : nome,
    description: "Plataforma para criar loja virtual de cestas e presentes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: COR_PAPEL,
    theme_color: COR_TINTA,
    icons: [
      { src: "/plataforma-arquivos/icone/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/plataforma-arquivos/icone/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/plataforma-arquivos/icone/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

const escXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function inicialDaMarca(nome: string): string {
  const letra = Array.from(nome.trim())[0] ?? "P";
  return letra.toLocaleUpperCase("pt-BR");
}

/** SVG simples do ícone: quadrado de tinta, inicial em papel e um ponto de acento. `maskable` = desenho a 80%. */
export function svgDoIcone(inicial: string, size: number, maskable: boolean): string {
  const escala = maskable ? 0.8 : 1;
  const centro = size / 2;
  const fonte = Math.round(size * 0.52 * escala);
  const ponto = Math.round(size * 0.07 * escala);
  const dx = Math.round(centro + size * 0.24 * escala);
  const dy = Math.round(centro + size * 0.2 * escala);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${COR_TINTA}"/>` +
    `<text x="${centro}" y="${centro}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fonte}" ` +
    `fill="${COR_PAPEL}" text-anchor="middle" dominant-baseline="central">${escXml(inicial)}</text>` +
    `<circle cx="${dx}" cy="${dy}" r="${ponto}" fill="${COR_ACENTO}"/>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ llms.txt */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function textoDe(item: unknown, chaves: string[]): string {
  const o = (item ?? {}) as Record<string, unknown>;
  for (const k of chaves) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}
const rotuloDe = (item: unknown) =>
  textoDe(item, ["titulo", "nome", "title", "name", "rotulo"]) || String((item as { slug?: string }).slug ?? "");
const resumoDe = (item: unknown) => textoDe(item, ["resumo", "descricao", "description", "promessa", "subtitulo"]);
const embreve = (item: unknown) => ((item as { status?: string }).status === "em-breve" ? " (em breve, ainda não disponível)" : "");

/** Recursos que existem hoje (briefing do site da plataforma). Nada aqui é promessa de futuro. */
const RECURSOS_DISPONIVEIS = [
  "Loja online com modelos prontos",
  "Carrinho com várias cestas",
  "Entrega com data, horário e frete por CEP",
  "Cartão de mensagem no pedido",
  "Pagamentos por PIX, cartão e boleto (Asaas), na conta do próprio lojista",
  "Avaliações com foto da entrega",
  "Estoque e compras",
  "E-mails automáticos (pedido, pagamento, entrega e pesquisa)",
  "Cupons, tarjas e promoções",
  "SEO e Google (GA4 e Search Console)",
  "App no celular: a loja vira aplicativo instalável",
  "Painel e relatórios",
  "Cestas para empresas, com pedido de orçamento",
];
const RECURSOS_EM_BREVE = [
  "Integração com o ERP Bling (pedidos, estoque, produtos e nota fiscal)",
  "Recuperação de carrinho com horário fixo",
];

export async function buildLlmsPlataforma(full: boolean, base: string): Promise<string> {
  const nome = await nomeDaMarca();
  const { plans, trialDays } = await getPublicPlansPage().catch(() => ({ plans: null, trialDays: null }));
  const variacoes = MODELOS.reduce((n, m) => n + m.telas.length, 0);
  const recursos = COM_SLUG(RECURSOS);
  const solucoes = COM_SLUG(SOLUCOES);

  const L: string[] = [];
  L.push(`# ${nome}`, "");
  L.push(
    `> ${nome} é uma plataforma para criar lojas virtuais de cestas e presentes no Brasil: vitrine pronta, carrinho, entrega por data e CEP, pagamento por PIX, cartão e boleto, e painel para o lojista.`,
    "",
  );

  L.push("## Recursos", "");
  if (recursos.length) {
    for (const r of recursos) L.push(`- [${rotuloDe(r)}](${base}/recursos/${r.slug})${embreve(r)}${resumoDe(r) ? `: ${resumoDe(r)}` : ""}`);
  } else L.push(`- [Todos os recursos](${base}/recursos)`);
  L.push("");

  L.push("## Soluções por situação", "");
  if (solucoes.length) {
    for (const s of solucoes) L.push(`- [${rotuloDe(s)}](${base}/solucoes/${s.slug})${resumoDe(s) ? `: ${resumoDe(s)}` : ""}`);
  } else L.push(`- [Todas as soluções](${base}/solucoes)`);
  L.push("");

  L.push("## Páginas", "");
  L.push(`- [Planos e preços](${base}/planos)`, `- [Modelos de loja](${base}/modelos)`, `- [Criar loja](${base}/cadastro)`, "");

  if (full) {
    L.push("## O que a plataforma entrega hoje", "");
    for (const r of RECURSOS_DISPONIVEIS) L.push(`- ${r}`);
    L.push("", "## Em breve (ainda não disponível)", "");
    for (const r of RECURSOS_EM_BREVE) L.push(`- ${r}`);
    L.push("");

    L.push("## Planos", "");
    if (plans === null) L.push("Os planos não puderam ser carregados agora; veja a página de planos.", "");
    else if (plans.length === 0) L.push("Nenhum plano publicado no momento.", "");
    else {
      for (const p of plans) {
        const preco = p.monthlyCents > 0 ? `${brl.format(p.monthlyCents / 100)} por mês` : "grátis";
        L.push(`### ${p.name}`, `Preço: ${preco}.${p.description ? ` ${p.description.trim()}` : ""}`);
        const itens = p.included.map((f) => (f.limitDisplay ? `${f.name} (${f.limitDisplay})` : f.name));
        if (itens.length) L.push(`Inclui: ${itens.join("; ")}.`);
        L.push("");
      }
    }
    if (trialDays !== null && trialDays > 0) L.push(`Teste grátis: ${trialDays} dias.`, "");

    L.push("## Modelos de loja", "");
    L.push(`São ${MODELOS.length} modelos, com ${variacoes} variações de cor e estilo.`, "");
    for (const m of MODELOS) L.push(`- [${m.name}](${base}/modelos/${m.key}): ${m.resumo} (${m.plano})`);
    L.push("");
  }

  return L.join("\n").trimEnd() + "\n";
}
