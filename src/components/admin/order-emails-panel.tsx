"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Mail } from "lucide-react";
import { resendOrderEmail, type OrderEmailRow, type ResendKind } from "@/modules/orders/email-actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

const TYPE_LABEL: Record<string, string> = {
  order_confirmed: "Pedido efetuado",
  order_group_confirmed: "Resumo do carrinho",
  order_paid: "Pagamento confirmado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Agradecimento (entregue)",
  review_invite: "Pesquisa de avaliação",
  cart_recovery: "Lembrete de pagamento",
};

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  sent: { text: "Enviado", tone: "bg-primary/10 text-primary" },
  pending: { text: "Na fila", tone: "bg-secondary text-muted-foreground" },
  pending_domain: { text: "Não enviado (e-mail não configurado)", tone: "bg-amber-100 text-amber-800" },
  failed: { text: "Falhou", tone: "bg-destructive/10 text-destructive" },
};

const RESEND: Array<{ kind: ResendKind; label: string }> = [
  { kind: "placed", label: "Pedido efetuado" },
  { kind: "paid", label: "Pagamento confirmado" },
  { kind: "delivered", label: "Agradecimento" },
  { kind: "review", label: "Pesquisa" },
];

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Painel "E-mails" do pedido: o que foi (ou não foi) enviado e o botão de
 * reenviar. "Enviar para mim" manda para o e-mail de quem está logado no painel
 * (teste) sem incomodar o cliente.
 */
export function OrderEmailsPanel({
  orderId,
  emails,
  buyerEmail,
}: {
  orderId: string;
  emails: OrderEmailRow[];
  buyerEmail: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const notConfigured = emails.some((e) => e.status === "pending_domain");

  async function resend(kind: ResendKind, label: string, toMe: boolean) {
    setMessage(null);
    if (!toMe) {
      const r = await confirm({
        title: `Reenviar “${label}” ao cliente?`,
        description: `O e-mail vai para ${buyerEmail ?? "o cliente"}.${
          kind === "placed" ? " O link de acompanhamento do e-mail antigo deixa de funcionar (é gerado um novo)." : ""
        }`,
        confirmLabel: "Reenviar",
        cancelLabel: "Voltar",
      });
      if (!r.ok) return;
    }
    startTransition(async () => {
      const res = await resendOrderEmail(orderId, kind, toMe);
      setMessage(res.ok ? { ok: true, text: `Enviado para ${res.sentTo}.` } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-card border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Mail className="size-4" /> E-mails
      </h2>

      {notConfigured ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          O envio de e-mails ainda não está configurado nesta loja: os avisos abaixo ficaram guardados e não chegaram ao
          cliente. Depois de configurar, use “Reenviar”.
        </p>
      ) : null}

      {emails.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum e-mail registrado para este pedido.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {emails.map((e) => {
            const st = STATUS_LABEL[e.status] ?? { text: e.status, tone: "bg-secondary text-muted-foreground" };
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{TYPE_LABEL[e.type] ?? e.type}</span>
                  <span className="block text-xs text-muted-foreground">
                    {fmt(e.sent_at ?? e.created_at)}
                    {e.to_email ? ` · ${e.to_email}` : ""}
                    {e.error ? ` · ${e.error}` : ""}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.tone}`}>{st.text}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium text-foreground">Reenviar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RESEND.map(({ kind, label }) => (
            <span key={kind} className="inline-flex overflow-hidden rounded-full border border-border">
              <button
                type="button"
                disabled={pending || !buyerEmail}
                onClick={() => resend(kind, label, false)}
                className="h-11 px-3.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                {label}
              </button>
              {kind !== "review" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => resend(kind, label, true)}
                  title="Enviar só para o meu e-mail (teste)"
                  className="h-11 border-l border-border px-3 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  para mim
                </button>
              ) : null}
            </span>
          ))}
          {pending ? <Loader2 className="size-4 animate-spin self-center" /> : null}
        </div>
        {!buyerEmail ? <p className="mt-2 text-xs text-muted-foreground">Este pedido não tem e-mail do cliente.</p> : null}
        {message ? (
          <p role="status" className={`mt-2 text-xs ${message.ok ? "text-primary" : "text-destructive"}`}>
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
