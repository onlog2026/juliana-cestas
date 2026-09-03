"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createTicket } from "@/modules/support/actions";
import { AttachmentUploadField } from "@/components/support/attachment-upload-field";
import type { TicketCategory } from "@/modules/support/service";

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "pedido", label: "Sobre um pedido" },
  { value: "entrega", label: "Entrega" },
  { value: "pagamento", label: "Pagamento" },
  { value: "bug", label: "Problema no site" },
  { value: "feedback", label: "Sugestão" },
];

type OrderOption = { id: string; number: number };

export function NewTicketForm({ orders }: { orders: OrderOption[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("pedido");
  const [orderId, setOrderId] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTicket({
        subject,
        category,
        orderId: orderId || null,
        body,
        attachmentUrl,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/conta/atendimento/${result.ticketId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Assunto</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Resumo do que você precisa"
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {orders.length > 0 ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Sobre qual pedido? (opcional)</span>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Nenhum específico</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  Pedido #{o.number}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Mensagem</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Conte com detalhes o que aconteceu"
          className="w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">Anexar uma foto (opcional)</span>
        <AttachmentUploadField value={attachmentUrl} onChange={setAttachmentUrl} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Abrir chamado
      </button>
    </form>
  );
}
