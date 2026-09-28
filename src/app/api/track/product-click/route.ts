import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";

/**
 * Conta um clique em produto (vitrine "Mais clicados"). Responde SEMPRE 204:
 * quem clicou não pode ver erro nem descobrir o que foi (ou não foi) contado.
 * O tenant nunca vem do navegador -- a função do banco deriva do produto.
 *
 * Ignora: outra origem, equipe logada (cookie sb-*-auth-token), robôs,
 * productId que não é uuid e excesso por IP. `TRACK_DRY_RUN=1` valida tudo e
 * não grava (usado em teste, porque o banco de desenvolvimento é o de produção).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawler|spider|crawling|preview|facebookexternalhit|headless|lighthouse/i;
const STAFF_COOKIE = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/;

const noContent = () => new Response(null, { status: 204 });

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return host === new URL(req.url).host || host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return noContent();
    if (BOT.test(req.headers.get("user-agent") ?? "")) return noContent();
    if (STAFF_COOKIE.test(req.headers.get("cookie") ?? "")) return noContent();

    const body = (await req.json().catch(() => null)) as { productId?: unknown } | null;
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!UUID.test(productId)) return noContent();

    if (!(await checkRateLimit(`click:${clientIp(req)}`, 30, 60))) return noContent();
    if (process.env.TRACK_DRY_RUN === "1") return noContent();

    await createAdminClient().rpc("increment_product_click", { p_product: productId });
  } catch {
    // Contar clique nunca pode gerar erro.
  }
  return noContent();
}
