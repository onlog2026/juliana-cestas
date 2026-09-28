"use client";

import { MessageCircle, Check } from "lucide-react";
import type { CartItem } from "@/modules/cart/types";
import type { GroupOrderSummary } from "@/modules/checkout/create-order-group";
import { formatCents } from "@/lib/money";

export type GroupConfirmationData = {
  buyerName: string;
  orders: GroupOrderSummary[];
  totalCents: number;
  /** As cestas como estavam no carrinho -- só para montar o resumo na tela e na mensagem do WhatsApp. */
  gifts: CartItem[];
};

/** "2026-09-30" -> "30/09" */
function formatShortDate(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function buildWhatsappMessage(data: GroupConfirmationData): string {
  const lines = [
    `Olá! Sou ${data.buyerName} e acabei de fechar um pedido com ${data.orders.length} cestas (nº ${data.orders.map((o) => o.number).join(", ")}).`,
    "",
    ...data.gifts.map((g, i) => {
      const date = g.delivery.deliveryDate
        ? `${formatShortDate(g.delivery.deliveryDate)} às ${g.delivery.deliverySlotStart}`
        : "data a combinar";
      return `${i + 1}. ${g.display.name} — para ${g.recipient.name || "?"} — ${date}`;
    }),
    "",
    `Total: ${formatCents(data.totalCents)}`,
    "",
    "Vamos combinar o pagamento?",
  ];
  return lines.join("\n");
}

type Props = {
  data: GroupConfirmationData;
  storeName: string;
  whatsapp: string;
  onNewOrder: () => void;
};

/** Tela final do carrinho: os N pedidos confirmados + total, e o botão que
 *  abre o WhatsApp com o resumo pronto para combinar o pagamento (a loja não
 *  cobra online hoje -- é o mesmo caminho que o checkout avulso já usa). */
export function GroupConfirmation({ data, storeName, whatsapp, onNewOrder }: Props) {
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(buildWhatsappMessage(data))}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-accent p-5">
        <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Check className="size-5 text-primary" />
          Pedido recebido{storeName ? ` — ${storeName}` : ""}!
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {data.orders.length} {data.orders.length === 1 ? "cesta confirmada" : "cestas confirmadas"}. Falta só
          combinar o pagamento pelo WhatsApp.
        </p>
      </div>

      <div className="space-y-3">
        {data.gifts.map((gift, i) => {
          const order = data.orders[i];
          return (
            <div key={gift.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{gift.display.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  Para {gift.recipient.name} · Pedido nº {order?.number ?? "—"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {order ? formatCents(order.totalCents) : "—"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span className="text-sm font-medium text-foreground">Total do pedido</span>
        <span className="text-lg font-bold tabular-nums text-foreground">{formatCents(data.totalCents)}</span>
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-shine-cta flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-7 text-base font-semibold text-white transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-5" />
        Combinar pagamento pelo WhatsApp
      </a>

      <button type="button" onClick={onNewOrder} className="mx-auto block text-sm font-medium text-primary hover:underline">
        Fazer outro pedido
      </button>
    </div>
  );
}
