import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";
import {
  createPaymentForOrder,
  getOrderPaymentStatus,
  syncPaymentFromGateway,
  type PaymentMethod,
} from "@/modules/payments/service";

/**
 * Pagamento do pedido pelo comprador.
 *
 *   GET  /api/checkout/payment-status?orderId=…&t=…        → situação (para a página consultar)
 *   POST /api/checkout/payment-status  { orderId, t, metodo } → gera a cobrança
 *
 * Duas regras que valem para os dois verbos:
 *
 * 1. A LOJA vem de `getTenantId()` (endereço acessado, resolvido no
 *    middleware). Nunca do corpo — senão o navegador criaria cobrança na conta
 *    de outra loja.
 * 2. O VALOR nunca aparece aqui. Quem cobra é `createPaymentForOrder`, que lê
 *    `orders.total_cents` do banco. Não existe campo de valor nesta rota, de
 *    propósito: campo que não existe não pode ser forjado.
 *
 * Se a loja não tiver conta Asaas conectada, o POST responde 409 com
 * `code: "sem_conta"` — e a página deve seguir com o WhatsApp, exatamente
 * como é hoje. Nada regride para quem não conectou.
 */

const METODOS: PaymentMethod[] = ["PIX", "CREDIT_CARD", "BOLETO"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // chamada server-to-server não manda Origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const originHost = new URL(origin).host;
    if (originHost === new URL(req.url).host) return true;
    if (siteUrl && originHost === new URL(siteUrl).host) return true;
    return false;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId") ?? "";
  const token = url.searchParams.get("t") ?? "";

  if (!orderId || !token) return json({ error: "Pedido não informado." }, 400);

  const withinLimit = await checkRateLimit(`pay-status:${clientIp(req)}`, 120, 600);
  if (!withinLimit) return json({ error: "Muitas consultas. Espera um pouco." }, 429);

  const tenantId = await getTenantId();
  const situacao = await getOrderPaymentStatus(tenantId, orderId, token);
  if (!situacao) return json({ error: "Pedido não encontrado." }, 404);

  // Rede de segurança: se um webhook se perdeu, quem abrir a página
  // reconcilia sozinho consultando o Asaas ao vivo.
  if (!situacao.paid && situacao.payment?.paymentId && situacao.payment.status === "pending") {
    const sincronizado = await syncPaymentFromGateway(tenantId, situacao.payment.paymentId);
    if (sincronizado?.paid) {
      return json({ ...situacao, paid: true, paymentStatus: "paid", orderStatus: "pago" });
    }
  }

  return json(situacao);
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Origem não permitida." }, 403);

  const withinLimit = await checkRateLimit(`pay-create:${clientIp(req)}`, 20, 600);
  if (!withinLimit) return json({ error: "Muitas tentativas. Espera um pouco e tenta de novo." }, 429);

  let body: { orderId?: unknown; t?: unknown; metodo?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const token = typeof body.t === "string" ? body.t : "";
  const metodo = typeof body.metodo === "string" ? (body.metodo as PaymentMethod) : "PIX";

  if (!orderId || !token) return json({ error: "Pedido não informado." }, 400);
  if (!METODOS.includes(metodo)) return json({ error: "Forma de pagamento inválida." }, 422);

  const tenantId = await getTenantId();

  // O token do pedido é a autorização: sem ele, ninguém gera cobrança para o
  // pedido dos outros. `getOrderPaymentStatus` valida id + loja + token.
  const situacao = await getOrderPaymentStatus(tenantId, orderId, token);
  if (!situacao) return json({ error: "Pedido não encontrado." }, 404);
  if (situacao.paid) return json({ error: "Esse pedido já está pago.", paid: true }, 409);

  const resultado = await createPaymentForOrder(tenantId, orderId, metodo);

  if (!resultado.ok) {
    // "sem_conta" NÃO é erro do comprador: é a loja que ainda combina pelo
    // WhatsApp. A página trata este código mantendo o fluxo de hoje.
    const status = resultado.code === "sem_conta" ? 409 : resultado.code === "gateway" ? 502 : 400;
    return json({ error: resultado.error, code: resultado.code }, status);
  }

  return json({ payment: resultado.payment });
}
