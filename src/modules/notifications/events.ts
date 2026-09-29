import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { weekdayOfDateStr } from "@/lib/time/sao-paulo";
import { getEmailBrand, sendOrderEmail } from "@/modules/notifications/send";
import { orderPaidEmail } from "@/modules/notifications/templates/order-paid";
import { orderPlacedEmail } from "@/modules/notifications/templates/order-placed";

/**
 * Gatilhos de e-mail que dependem de LER pedidos do banco (o checkout e as
 * ações do painel só chamam estas funções). Regras que valem para todas:
 *  - NUNCA lançam: o pedido/pagamento já está gravado; e-mail é melhor esforço.
 *  - São idempotentes: se o mesmo aviso já foi enviado (ou está na fila) para o
 *    pedido, não mandam de novo (pagamento marcado à mão + webhook do Asaas no
 *    mesmo minuto não geram e-mail duplo).
 */

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function dateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${WEEKDAYS[weekdayOfDateStr(dateStr)]}, ${d}/${m}`;
}

type OrderRow = {
  id: string;
  number: number;
  buyer_name: string;
  buyer_email: string | null;
  recipient_name: string;
  delivery_date: string;
  delivery_slot_start: string;
  delivery_slot_end: string;
  total_cents: number;
};

const COLUMNS =
  "id, number, buyer_name, buyer_email, recipient_name, delivery_date, delivery_slot_start, delivery_slot_end, total_cents";

/** Já existe aviso deste tipo (enviado ou na fila) para o pedido? */
async function alreadyNotified(tenantId: string, orderId: string, type: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from("notifications")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("order_id", orderId)
      .eq("type", type)
      .in("status", ["pending", "sent"])
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

/**
 * "Pagamento confirmado" para um ou mais pedidos do MESMO comprador (um pedido
 * avulso, ou o carrinho inteiro pago de uma vez -> UM e-mail só).
 */
export async function notifyOrderPaid(tenantId: string, orderIds: string[]): Promise<void> {
  try {
    if (orderIds.length === 0) return;
    const admin = createAdminClient();
    const { data } = await admin.from("orders").select(COLUMNS).eq("tenant_id", tenantId).in("id", orderIds).order("number");
    const orders = (data ?? []) as OrderRow[];
    const first = orders[0];
    if (!first?.buyer_email) return;
    if (await alreadyNotified(tenantId, first.id, "order_paid")) return;

    const brand = await getEmailBrand(tenantId);
    const { subject, html, text } = orderPaidEmail(
      {
        buyerName: first.buyer_name,
        orders: orders.map((o) => ({ orderNumber: o.number, recipientName: o.recipient_name, totalCents: o.total_cents })),
        ctaUrl: brand.siteUrl || undefined,
        ctaLabel: "Visitar a loja",
      },
      brand
    );
    await sendOrderEmail(tenantId, { orderId: first.id, type: "order_paid", toEmail: first.buyer_email, subject, html, text });
  } catch (err) {
    console.error("[notifications] falha ao avisar pagamento:", err);
  }
}

/**
 * Resumo do carrinho com várias cestas, logo depois que todas foram criadas:
 * UM e-mail com uma linha por cesta (em vez de N e-mails).
 */
export async function notifyGroupPlaced(
  tenantId: string,
  params: { groupId: string; firstOrderId: string; token: string }
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select(COLUMNS)
      .eq("tenant_id", tenantId)
      .eq("group_id", params.groupId)
      .order("number");
    const orders = (data ?? []) as OrderRow[];
    const first = orders[0];
    if (!first?.buyer_email) return;
    if (await alreadyNotified(tenantId, first.id, "order_group_confirmed")) return;

    const brand = await getEmailBrand(tenantId);
    const totalCents = orders.reduce((sum, o) => sum + o.total_cents, 0);
    const { subject, html, text } = orderPlacedEmail(
      {
        buyerName: first.buyer_name,
        orders: orders.map((o) => ({
          orderNumber: o.number,
          recipientName: o.recipient_name,
          deliveryDateLabel: dateLabel(o.delivery_date),
          slotLabel: `${o.delivery_slot_start.slice(0, 5)} e ${o.delivery_slot_end.slice(0, 5)}`,
          totalCents: o.total_cents,
        })),
        totalCents,
        orderUrl: `${brand.siteUrl}/pedido/${params.firstOrderId}?t=${params.token}`,
      },
      brand
    );
    await sendOrderEmail(tenantId, {
      orderId: first.id,
      type: "order_group_confirmed",
      toEmail: first.buyer_email,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[notifications] falha ao enviar o resumo do carrinho:", err);
  }
}
