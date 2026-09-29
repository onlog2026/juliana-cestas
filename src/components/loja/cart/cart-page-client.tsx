"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/modules/cart/cart-context";
import { events } from "@/modules/analytics/events";
import { TrackBeginCheckout } from "@/components/analytics/track-events";
import { checkoutBuyerSchema } from "@/modules/checkout/schemas";
import type { CartItem } from "@/modules/cart/types";
import { giftIssues } from "@/modules/cart/validate";
import type { DaySlots } from "@/modules/delivery/slots";
import { formatCents } from "@/lib/money";
import { BuyerForm } from "@/components/loja/cart/buyer-form";
import { CartItemRow } from "@/components/loja/cart/cart-item-row";
import { GiftEditor } from "@/components/loja/cart/gift-editor";
import { GroupConfirmation, type GroupConfirmationData } from "@/components/loja/cart/group-confirmation";

/** Traduz o erro de campo do checkoutBuyerSchema (buyerName -> name, etc.) para
 *  os rótulos que o BuyerForm usa. */
function mapBuyerErrors(flatten: { fieldErrors: Record<string, string[] | undefined> }): Record<string, string> {
  const map: Record<string, string> = {};
  const pairs: [string, string][] = [
    ["buyerName", "name"],
    ["buyerEmail", "email"],
    ["buyerPhone", "phone"],
    ["buyerCpf", "cpf"],
  ];
  for (const [from, to] of pairs) {
    const msg = flatten.fieldErrors[from]?.[0];
    if (msg) map[to] = msg;
  }
  return map;
}

export function CartPageClient({ storeName, whatsapp }: { storeName: string; whatsapp: string }) {
  const { items, ready, buyer, setBuyer, updateGift, removeGift, clear } = useCart();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [cardMaxWords, setCardMaxWords] = useState(40);
  const [buyerErrors, setBuyerErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<GroupConfirmationData | null>(null);

  // Datas/horários são os mesmos para todas as cestas da loja -- busca 1 vez
  // e passa para cada GiftEditor (evita N chamadas repetidas).
  useEffect(() => {
    fetch("/api/checkout/slots")
      .then((r) => r.json())
      .then((data: { days?: DaySlots[]; cardMaxWords?: number }) => {
        if (Array.isArray(data.days)) setDays(data.days);
        if (typeof data.cardMaxWords === "number") setCardMaxWords(data.cardMaxWords);
      })
      .catch(() => setDays([]));
  }, []);

  // Limpa o aviso de "cesta com dados faltando" assim que o carrinho muda
  // (editou/removeu) -- senão a mensagem de uma tentativa antiga fica presa na
  // tela mesmo depois de o problema já ter sido resolvido.
  useEffect(() => {
    setSubmitError(null);
  }, [items]);

  if (confirmation) {
    return (
      <GroupConfirmation
        data={confirmation}
        storeName={storeName}
        whatsapp={whatsapp}
        onNewOrder={() => {
          setConfirmation(null);
          clear();
        }}
      />
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando seu carrinho…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Ver cestas
        </Link>
      </div>
    );
  }

  const editingGift = editingId ? items.find((g) => g.id === editingId) : null;
  const totalCents = items.reduce((sum, g) => sum + (g.estimatedCents ?? 0), 0);
  const incompleteCount = items.filter((g) => giftIssues(g).length > 0).length;

  function handleSaveGift(next: CartItem) {
    updateGift(next.id, next);
    setEditingId(null);
  }

  async function handleFinalize() {
    setSubmitError(null);
    setBuyerErrors({});

    const buyerParsed = checkoutBuyerSchema.safeParse({
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      buyerCpf: buyer.cpf,
    });
    if (!buyerParsed.success) {
      setBuyerErrors(mapBuyerErrors(buyerParsed.error.flatten()));
      return;
    }
    if (incompleteCount > 0) {
      setSubmitError(`${incompleteCount} ${incompleteCount === 1 ? "cesta está" : "cestas estão"} com dados faltando. Edite antes de finalizar.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create-order-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer,
          gifts: items.map((g) => ({
            idempotencyKey: g.idempotencyKey,
            productSlug: g.productSlug,
            addonSlugs: g.addonSlugs,
            upsellSlugs: g.upsellSlugs,
            recipientName: g.recipient.name,
            recipientPhone: g.recipient.phone,
            deliveryType: g.delivery.type,
            cep: g.delivery.cep,
            street: g.delivery.street,
            addressNumber: g.delivery.addressNumber,
            complement: g.delivery.complement,
            neighborhood: g.delivery.neighborhood,
            city: g.delivery.city,
            state: g.delivery.state,
            deliveryDate: g.delivery.deliveryDate,
            deliverySlotStart: g.delivery.deliverySlotStart,
            cardTemplate: g.card.template,
            cardRecipient: g.card.recipient,
            cardSender: g.card.sender,
            cardMessage: g.card.message,
            notes: g.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Não foi possível fechar o pedido. Tente de novo.");
        return;
      }
      // Conversão do carrinho: UM purchase (chave = nº do primeiro pedido), sem dado do comprador.
      events.purchase(
        data.orders?.[0]?.number ?? data.groupId ?? "grupo",
        (data.totalCents ?? 0) / 100,
        items.map((g) => ({ id: g.productId ?? g.productSlug, name: g.display.name, price: g.display.priceCents / 100 }))
      );
      setConfirmation({ buyerName: buyer.name, orders: data.orders, totalCents: data.totalCents, gifts: items });
    } catch {
      setSubmitError("Não deu pra fechar o pedido agora. Confira sua internet e tente de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <TrackBeginCheckout items={items.map((g) => ({ id: g.productId ?? g.productSlug, name: g.display.name, price: g.display.priceCents / 100 }))} />
      {editingGift ? (
        <GiftEditor
          gift={editingGift}
          days={days}
          cardMaxWords={cardMaxWords}
          storeName={storeName}
          onSave={handleSaveGift}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((gift) => (
              <CartItemRow
                key={gift.id}
                gift={gift}
                onEdit={() => setEditingId(gift.id)}
                onRemove={() => removeGift(gift.id)}
              />
            ))}
          </div>

          <BuyerForm buyer={buyer} onChange={setBuyer} errors={buyerErrors} />

          {submitError ? (
            <p className="rounded-[10px] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          {/* Barra fixa embaixo: total + finalizar, sempre visível ao rolar. */}
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card px-4 py-3 md:bottom-0 md:pl-[calc(50%-24rem)] md:pr-[calc(50%-24rem)]">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "cesta" : "cestas"}
                </p>
                <p className="text-lg font-bold tabular-nums text-foreground">{formatCents(totalCents)}</p>
              </div>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={submitting}
                className="jc-shine-cta inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-5 animate-spin" /> : "Finalizar pedido"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
