import Link from "next/link";
import { Plus, Headset } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerTickets } from "@/modules/support/service";
import { TicketStatusBadge, categoryLabel } from "@/components/support/ticket-status-badge";

export const metadata = { title: "Atendimento" };

export default async function ContaAtendimentoPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const tickets = await getCustomerTickets(user.id, user.email ?? null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl text-foreground">
          <Headset className="size-6 text-primary" /> Atendimento
        </h1>
        <Link
          href="/conta/atendimento/novo"
          className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Novo chamado
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Você ainda não abriu nenhum chamado. Precisa de ajuda com um pedido, entrega ou pagamento? Abra um chamado.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/conta/atendimento/${ticket.id}`}
              className="jc-nav-hover flex items-center justify-between gap-3 rounded-card border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(ticket.category)} · {new Date(ticket.last_message_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
