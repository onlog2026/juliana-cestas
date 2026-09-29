"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { generatePublicToken, hashToken } from "@/modules/orders/token";
import { weekdayOfDateStr } from "@/lib/time/sao-paulo";
import { getEmailBrand, sendOrderEmail } from "@/modules/notifications/send";
import { orderPlacedEmail } from "@/modules/notifications/templates/order-placed";
import { deliveredEmail } from "@/modules/notifications/templates/delivered";
import { orderPaidEmail } from "@/modules/notifications/templates/order-paid";
import { createReviewInvite } from "@/modules/reviews/invite";

export type OrderEmailRow = {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  to_email: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

/** E-mails registrados para o pedido (mais recentes primeiro). Nunca lança. */
export async function getOrderEmails(orderId: string): Promise<OrderEmailRow[]> {
  const staff = await requireStaff();
  try {
    const { data } = await createAdminClient()
      .from("notifications")
      .select("id, type, status, subject, to_email, error, created_at, sent_at")
      .eq("tenant_id", staff.tenantId)
      .eq("order_id", orderId)
      .eq("channel", "email")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as OrderEmailRow[];
  } catch {
    return [];
  }
}

export type ResendKind = "placed" | "paid" | "delivered" | "review";

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/**
 * Reenvia um dos e-mails do pedido, reconstruído a partir dos dados de hoje.
 * `toMe = true` manda para o e-mail de quem está logado no painel (teste), sem
 * incomodar o cliente. Reenviar "pedido efetuado" gera um link de acompanhamento
 * NOVO (o token antigo só existe no e-mail original, guardado como hash) -- o link
 * do e-mail antigo deixa de funcionar.
 */
export async function resendOrderEmail(
  orderId: string,
  kind: ResendKind,
  toMe = false
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, number, status, buyer_name, buyer_email, recipient_name, delivery_date, delivery_slot_start, delivery_slot_end, total_cents"
    )
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  const target = toMe ? staff.email : order.buyer_email;
  if (!target) {
    return { ok: false, error: toMe ? "Seu usuário não tem e-mail cadastrado." : "Este pedido não tem e-mail do cliente." };
  }
  const brand = await getEmailBrand(staff.tenantId);

  try {
    if (kind === "paid") {
      // Reenvio manual: não passa pela trava "já avisado" (quem clicou quer mandar de novo).
      await sendPaid(staff.tenantId, order, target, brand);
    } else if (kind === "placed") {
      const token = generatePublicToken();
      const { error } = await admin
        .from("orders")
        .update({ public_token_hash: hashToken(token) })
        .eq("id", order.id)
        .eq("tenant_id", staff.tenantId);
      if (error) return { ok: false, error: "Não foi possível gerar o novo link de acompanhamento." };
      const [, m, d] = String(order.delivery_date).split("-");
      const { subject, html, text } = orderPlacedEmail(
        {
          buyerName: order.buyer_name,
          orders: [
            {
              orderNumber: order.number,
              recipientName: order.recipient_name,
              deliveryDateLabel: `${WEEKDAYS[weekdayOfDateStr(order.delivery_date)]}, ${d}/${m}`,
              slotLabel: `${String(order.delivery_slot_start).slice(0, 5)} e ${String(order.delivery_slot_end).slice(0, 5)}`,
              totalCents: order.total_cents,
            },
          ],
          totalCents: order.total_cents,
          orderUrl: `${brand.siteUrl}/pedido/${order.id}?t=${token}`,
        },
        brand
      );
      await sendOrderEmail(staff.tenantId, { orderId, type: "order_confirmed", toEmail: target, subject, html, text });
    } else if (kind === "delivered") {
      const { subject, html, text } = deliveredEmail(
        { orderNumber: order.number, buyerName: order.buyer_name, shopUrl: brand.siteUrl || undefined },
        brand
      );
      await sendOrderEmail(staff.tenantId, { orderId, type: "delivered", toEmail: target, subject, html, text });
    } else {
      // Pesquisa: token novo. Para teste (toMe) o convite sai para o e-mail do painel.
      if (toMe) {
        return { ok: false, error: "A pesquisa é enviada só ao cliente (o link é pessoal). Use 'Reenviar ao cliente'." };
      }
      if (order.status !== "entregue") return { ok: false, error: "A pesquisa só pode ser enviada depois de entregue." };
      const r = await createReviewInvite(staff.tenantId, orderId, { resend: true });
      if (!r.ok) return r;
    }
  } catch (err) {
    console.error("[pedidos] falha ao reenviar e-mail:", err);
    return { ok: false, error: "Não foi possível reenviar o e-mail agora." };
  }
  return { ok: true, sentTo: target };
}

async function sendPaid(
  tenantId: string,
  order: { id: string; number: number; buyer_name: string; recipient_name: string; total_cents: number },
  target: string,
  brand: Awaited<ReturnType<typeof getEmailBrand>>
) {
  const { subject, html, text } = orderPaidEmail(
    {
      buyerName: order.buyer_name,
      orders: [{ orderNumber: order.number, recipientName: order.recipient_name, totalCents: order.total_cents }],
      ctaUrl: brand.siteUrl || undefined,
    },
    brand
  );
  await sendOrderEmail(tenantId, { orderId: order.id, type: "order_paid", toEmail: target, subject, html, text });
}
