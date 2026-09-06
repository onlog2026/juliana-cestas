import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTicketDetailAdmin } from "@/modules/support/service";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { replyAsStaff } from "@/modules/support/actions";
import { categoryLabel } from "@/components/support/ticket-status-badge";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketStatusSelect } from "@/components/admin/ticket-status-select";

export default async function AdminChamadoPage(props: PageProps<"/admin/atendimento/[id]">) {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de
  // digitar este endereço na barra do navegador. Quem chega aqui sem o
  // módulo "atendimento" no plano é levado para a página de oferta.
  // (Esta tela é o chamado aberto, com a conversa.)
  const staff = await requireStaffWithModule("atendimento");
  const { id } = await props.params;
  const detail = await getTicketDetailAdmin(staff.tenantId, id);
  if (!detail) notFound();
  const { ticket, messages } = detail;

  async function reply(input: { body: string; attachmentUrl: string }) {
    "use server";
    return replyAsStaff({ ticketId: ticket.id, ...input });
  }

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/atendimento" className="hover:text-primary">
          Atendimento
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{ticket.subject}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticket.buyer_name} ({ticket.buyer_email}) · {categoryLabel(ticket.category)}
          </p>
        </div>
        <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
      </div>

      <div className="mt-6">
        <TicketThread messages={messages} viewerRole="staff" onReply={reply} />
      </div>
    </div>
  );
}
