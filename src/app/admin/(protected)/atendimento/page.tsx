import Link from "next/link";
import { getAllTicketsAdmin } from "@/modules/support/service";
import { TicketStatusBadge, categoryLabel } from "@/components/support/ticket-status-badge";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "reaberto", label: "Reaberto" },
  { value: "resolvido", label: "Resolvido" },
];

export default async function AdminAtendimentoPage(props: PageProps<"/admin/atendimento">) {
  const { status } = await props.searchParams;
  const statusValue = Array.isArray(status) ? status[0] : status;
  const tickets = await getAllTicketsAdmin(statusValue ? { status: statusValue } : undefined);

  return (
    <div className="max-w-[1000px]">
      <h1 className="font-display text-2xl text-foreground">Atendimento</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chamados abertos pelos clientes na área de conta.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/atendimento?status=${f.value}` : "/admin/atendimento"}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              (statusValue ?? "") === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-card border border-border bg-card">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/atendimento/${ticket.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.buyer_name} · {categoryLabel(ticket.category)} ·{" "}
                  {new Date(ticket.last_message_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
