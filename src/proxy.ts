import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-host";
import { vitrineSuspensa } from "@/lib/tenant/storefront-status";
import {
  TENANT_HEADER_HOST_KIND,
  TENANT_HEADER_ID,
  TENANT_HEADER_SLUG,
} from "@/lib/tenant/context";

/**
 * Este arquivo roda ANTES de qualquer página, em toda visita. Duas coisas
 * acontecem aqui, e elas são separadas de propósito:
 *
 *  1. **Painel** (`/admin`, `/conta`): quem não está logado vai para o login.
 *     É o que já existia.
 *  2. **Vitrine** (o resto do site): loja com `status = 'suspended'` é levada
 *     para `/loja-indisponivel`.
 *
 * ═══ POR QUE A VITRINE CAI E O PAINEL NÃO ═══
 * Suspender é uma cobrança, não um castigo. Se o painel caísse junto, a lojista
 * ficaria trancada do lado de fora do único lugar onde consegue regularizar a
 * situação — e não entenderia por quê. Por isso `/admin` e `/auth` continuam
 * abertos mesmo com a loja suspensa; só o site que o cliente final vê sai do ar.
 *
 * ═══ O CAMINHO NORMAL NÃO MUDA ═══
 * Loja com `status = 'active'` (a da Juliana) passa por aqui exatamente como
 * antes: a consulta de status responde "não suspensa", em cache de um minuto, e
 * a página estática continua sendo servida do jeito que já era. Além disso, a
 * verificação de sessão do Supabase continua acontecendo SÓ no painel — a
 * vitrine nunca pagou por ela e continua não pagando.
 */

/** Rotas do painel: sessão é verificada, suspensão NÃO derruba. */
function ehAreaDeGestao(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path === "/auth" || path.startsWith("/auth/");
}

/** A própria página de aviso não pode redirecionar para ela mesma. */
const PAGINA_INDISPONIVEL = "/loja-indisponivel";

export async function proxy(request: NextRequest) {
  // Qual loja responde por este endereço. Resolvido ANTES de qualquer outra
  // coisa e gravado em headers -- o servidor lê daí, nunca do que o navegador
  // mandar. Como sobrescrevemos sempre (delete + set), header forjado pelo
  // cliente nunca sobrevive.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(TENANT_HEADER_ID);
  requestHeaders.delete(TENANT_HEADER_SLUG);
  requestHeaders.delete(TENANT_HEADER_HOST_KIND);

  const tenant = resolveTenantFromHost(request.headers.get("host"));
  if (tenant) {
    requestHeaders.set(TENANT_HEADER_ID, tenant.id);
    requestHeaders.set(TENANT_HEADER_SLUG, tenant.slug);
    requestHeaders.set(TENANT_HEADER_HOST_KIND, tenant.hostKind);
  }

  const path = request.nextUrl.pathname;

  // ── Vitrine ──────────────────────────────────────────────────────────────
  // Tudo o que não é painel. `vitrineSuspensa` nunca lança e, em qualquer
  // dúvida, responde "não suspensa": erro de leitura não tira loja do ar.
  if (!ehAreaDeGestao(path) && path !== PAGINA_INDISPONIVEL && tenant) {
    if (await vitrineSuspensa(tenant.id)) {
      const url = request.nextUrl.clone();
      url.pathname = PAGINA_INDISPONIVEL;
      url.search = "";
      // 307 (temporário) de propósito: a loja volta assim que a pendência for
      // resolvida, e um 301 ficaria gravado no navegador de quem visitou.
      return NextResponse.redirect(url, 307);
    }
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // ── Painel e área do cliente: sessão ─────────────────────────────────────
  // A verificação de sessão custa uma ida à rede. Ela roda só onde existe algo
  // protegido — a vitrine continua sem pagar esse preço, como sempre foi.
  const precisaDeSessao = path.startsWith("/admin") || path.startsWith("/conta");
  if (!precisaDeSessao) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (path.startsWith("/admin") && path !== "/admin/login" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/conta") && path !== "/conta/entrar" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/conta/entrar";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * O que NÃO passa por aqui, e por quê:
 *
 *  - `api/`        — os webhooks (Asaas) e o checkout precisam continuar
 *                    respondendo mesmo com a vitrine suspensa: dinheiro que já
 *                    entrou tem que ser processado de qualquer jeito.
 *  - `_next/`      — código e imagens gerados pelo Next.
 *  - `robots.txt`, `sitemap.xml`, `favicon.ico` e qualquer arquivo com
 *    extensão (`/logo.png`, `/fonte.woff2`) — arquivo estático não deve pagar
 *    o custo do middleware.
 */
export const config = {
  matcher: [
    "/((?!api/|_next/|robots\\.txt|sitemap\\.xml|favicon\\.ico|.*\\.[A-Za-z0-9]+$).*)",
  ],
};
