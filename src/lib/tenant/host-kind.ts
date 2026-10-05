/**
 * Tipo de ENDEREÇO que está respondendo, para separar o site da plataforma das lojas:
 *  - "plataforma": os endereços listados em `PLATFORM_HOSTS` (ex.: "dominio.com.br,www.dominio.com.br");
 *  - "preview": `*.vercel.app` e `localhost` (tudo liberado, como sempre foi);
 *  - "loja": qualquer outro (inclui julianacestas.com.br e julianacesta.com.br).
 *
 * É uma variável SEPARADA de `PLATFORM_DOMAIN` de propósito: `PLATFORM_DOMAIN` faz a loja ler
 * headers e perder a geração estática da home da Juliana. Esta aqui só decide caminhos.
 * Arquivo puro (roda no proxy/Edge): sem imports.
 */
export type TipoDeHost = "plataforma" | "preview" | "loja";

function semPortaEWww(host: string): string {
  return host.trim().toLowerCase().split(":")[0].replace(/^www\./, "");
}

export function listaDeHostsDaPlataforma(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map(semPortaEWww)
    .filter(Boolean);
}

export function tipoDeHost(rawHost: string | null | undefined, plataformaHosts: string | undefined): TipoDeHost {
  const host = semPortaEWww(rawHost ?? "");
  if (!host) return "loja";
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return "preview";
  if (listaDeHostsDaPlataforma(plataformaHosts).includes(host)) return "plataforma";
  return "loja";
}

/** Caminhos que SÓ existem no site da plataforma (em endereço de loja respondem 404). */
export const PREFIXOS_DA_PLATAFORMA = [
  "/inicio",
  "/plataforma",
  "/planos",
  "/cadastro",
  "/entrar",
  "/modelos",
  "/demo",
  "/recursos",
  "/solucoes",
  "/super",
  "/plataforma-arquivos",
] as const;

/** Caminhos que SÓ existem na loja (em endereço da plataforma respondem 404). */
export const PREFIXOS_DA_LOJA = [
  "/produto",
  "/categoria",
  "/carrinho",
  "/checkout",
  "/pedido",
  "/conta",
  "/avaliar",
  "/avaliacoes",
  "/loja-indisponivel",
  "/sobre",
  "/atendimento",
  "/faq",
  "/trocas-e-devolucoes",
  "/privacidade",
  "/termos",
] as const;

export function comecaCom(path: string, prefixos: readonly string[]): boolean {
  return prefixos.some((p) => path === p || path.startsWith(`${p}/`));
}
