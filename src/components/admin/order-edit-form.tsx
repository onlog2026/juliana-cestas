"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { atualizarDadosPedido, type AdminOrderDetail } from "@/modules/orders/actions";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/**
 * Editar os dados de entrega e do cartãozinho de um pedido já criado.
 *
 * Por que NÃO tem campo de item, quantidade, preço ou dados do comprador: ver
 * o comentário de `atualizarDadosPedido` em `orders/actions.ts` -- mexer em
 * valor cobrado ou na identidade de quem comprou precisa de uma tela própria,
 * não de um campo solto aqui.
 */
export function OrderEditForm({ order, onCancel }: { order: AdminOrderDetail; onCancel: () => void }) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState(order.recipient_name);
  const [recipientPhone, setRecipientPhone] = useState(order.recipient_phone ?? "");
  const [street, setStreet] = useState(order.street ?? "");
  const [addressNumber, setAddressNumber] = useState(order.address_number ?? "");
  const [complement, setComplement] = useState(order.complement ?? "");
  const [neighborhood, setNeighborhood] = useState(order.neighborhood ?? "");
  const [city, setCity] = useState(order.city ?? "");
  const [state, setState] = useState(order.state ?? "");
  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date);
  const [deliverySlotStart, setDeliverySlotStart] = useState(order.delivery_slot_start.slice(0, 5));
  const [deliverySlotEnd, setDeliverySlotEnd] = useState(order.delivery_slot_end.slice(0, 5));
  const [cardRecipient, setCardRecipient] = useState(order.card_recipient);
  const [cardSender, setCardSender] = useState(order.card_sender ?? "");
  const [cardMessage, setCardMessage] = useState(order.card_message);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarDadosPedido({
        id: order.id,
        recipientName,
        recipientPhone,
        street,
        addressNumber,
        complement,
        neighborhood,
        city,
        state,
        deliveryDate,
        deliverySlotStart,
        deliverySlotEnd,
        cardRecipient,
        cardSender,
        cardMessage,
        notes,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
      onCancel();
    });
  }

  return (
    <form onSubmit={enviar} className="mt-4 space-y-4 rounded-card border border-border bg-card p-5">
      <p className="text-sm font-medium text-foreground">Editar dados do pedido</p>
      <p className="text-xs text-muted-foreground">
        Aqui dá para corrigir endereço, data/horário, o cartãozinho e as observações. Itens, valores e os dados
        de quem comprou não são editáveis por aqui.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Nome de quem recebe</span>
          <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Telefone de quem recebe (opcional)</span>
          <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className={inputClass} />
        </label>
      </div>

      {order.delivery_type === "delivery" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Rua</span>
            <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Número</span>
            <input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Complemento</span>
            <input value={complement} onChange={(e) => setComplement(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Bairro</span>
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Cidade</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Estado (UF)</span>
            <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={inputClass} />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Data de entrega</span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>A partir de</span>
          <input
            type="time"
            value={deliverySlotStart}
            onChange={(e) => setDeliverySlotStart(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Até</span>
          <input
            type="time"
            value={deliverySlotEnd}
            onChange={(e) => setDeliverySlotEnd(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Cartãozinho — para quem</span>
          <input value={cardRecipient} onChange={(e) => setCardRecipient(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Cartãozinho — de quem (opcional)</span>
          <input value={cardSender} onChange={(e) => setCardSender(e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>Mensagem do cartãozinho</span>
        <textarea
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="block">
        <span className={labelClass}>Observações (opcional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Salvar alterações
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent"
        >
          <X className="size-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}
