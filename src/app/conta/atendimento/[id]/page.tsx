import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerTicketDetail } from "@/modules/support/service";
import { replyAsCustomer } from "@/modules/support/actions";
import { TicketStatusBadge, categoryLabel } from "@/components/support/ticket-status-badge";
import { TicketThread } from "@/components/support/ticket-thread";

export const metadata = { title: "Meu chamado" };

export default async function ContaChamadoPage(props: PageProps<"/conta/atendimento/[id]">) {
  const { id } = await props.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const detail = await getCustomerTicketDetail(user.id, user.email ?? null, id);
  if (!detail) notFound();
  const { ticket, messages } = detail;

  async function reply(input: { body: string; attachmentUrl: string }) {
    "use server";
    return replyAsCustomer({ ticketId: ticket.id, ...input });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/conta/atendimento" className="hover:text-primary">
          Atendimento
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{ticket.subject}</span>
      </nav>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">{ticket.subject}</h1>
        <TicketStatusBadge status={ticket.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{categoryLabel(ticket.category)}</p>

      <div className="mt-6">
        <TicketThread messages={messages} viewerRole="customer" onReply={reply} />
      </div>
    </div>
  );
}
