import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Package } from "lucide-react";
import { getOrderByToken } from "@/modules/orders/service";
import { getOrderPaymentStatus } from "@/modules/payments/service";
import { PaymentPanel } from "@/components/loja/checkout/payment-panel";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getCardTemplate } from "@/modules/cards/templates";
import { CardPattern } from "@/components/loja/checkout/card-pattern";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Seu pedido" };

const weekdayNames = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${weekdayNames[date.getUTCDay()]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export default async function PedidoPage(
  props: PageProps<"/pedido/[id]"> & { searchParams: Promise<{ t?: string }> }
) {
  const { id } = await props.params;
  const { t } = await props.searchParams;

  if (!t) notFound();
  const tenantId = await getTenantId();
  const order = await getOrderByToken(tenantId, id, t);
  if (!order) notFound();

  const template = getCardTemplate(order.card_template);
  const profile = await getStoreProfile(tenantId);
  const storeName = profile.businessName?.trim() || "";
  // Número do cadastro da loja (banco), só dígitos -- não mais do env.
  const whatsapp = (profile.phone ?? "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Olá! Quero finalizar o pagamento do meu pedido #${order.number}.`
  );
  const whatsappHref = `https://wa.me/${whatsapp}?text=${whatsappMessage}`;

  // A situação do pagamento é lida NO SERVIDOR, com o mesmo token que já
  // autoriza ver o pedido. Se a loja não conectou conta de recebimento,
  // `paymentEnabled` volta false e o painel mostra exatamente o que mostrava
  // antes: o botão do WhatsApp. Nada regride para quem não conectou.
  const pagamento = await getOrderPaymentStatus(tenantId, id, t);

  const addressLine = order.delivery_type === "pickup"
    ? "Retirada na loja"
    : [order.street, order.address_number, order.complement].filter(Boolean).join(", ") +
      (order.neighborhood ? ` — ${order.neighborhood}` : "") +
      (order.zone_name ? ` (${order.zone_name})` : "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Clock className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Pedido #{order.number} registrado
          </h1>
          <p className="text-sm text-muted-foreground">Aguardando pagamento</p>
        </div>
      </div>

      <div className="mt-8 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Entrega</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Para <strong className="text-foreground">{order.recipient_name}</strong>
        </p>
        <p className="text-sm text-muted-foreground">{addressLine}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(order.delivery_date)}, entre {order.delivery_slot_start.slice(0, 5)} e{" "}
          {order.delivery_slot_end.slice(0, 5)}
        </p>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="size-4" /> Itens
        </h2>
        <ul className="mt-3 space-y-1.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{item.name}</span>
              <span>{formatCents(item.unit_price_cents * item.qty)}</span>
            </li>
          ))}
        </ul>
        {order.delivery_fee_cents > 0 ? (
          <div className="mt-1.5 flex justify-between text-sm text-muted-foreground">
            <span>Entrega</span>
            <span>{formatCents(order.delivery_fee_cents)}</span>
          </div>
        ) : null}
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCents(order.total_cents)}</span>
        </div>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border px-8 py-8 ${template.paperClass} ${template.borderClass}`}
        style={{ boxShadow: "var(--jc-shadow)" }}
      >
        <CardPattern template={template} />
        <p className="relative font-display text-lg leading-relaxed text-[#3a3226]">{order.card_message}</p>
        <p className="relative mt-6 font-display text-base text-[#3a3226]">
          Para {order.card_recipient}
          {order.card_sender ? `, de ${order.card_sender}` : ""}.
        </p>
        <p className="relative mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">{storeName}</p>
      </div>

      <PaymentPanel
        orderId={id}
        token={t}
        pagamentoLigado={pagamento?.paymentEnabled ?? false}
        pagoInicial={pagamento?.paid ?? false}
        cobrancaInicial={pagamento?.payment ?? null}
        whatsappHref={whatsappHref}
        totalCents={order.total_cents}
      />

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Check className="mt-0.5 size-3.5 shrink-0" />
        Guarde o link desta página — é por ele que você acompanha o seu pedido.
      </p>

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-primary hover:underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
