import Link from "next/link";
import { Inbox, MessageSquare, Store, User } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  listPlatformTickets,
  listStoresWithTickets,
  getPlatformTicketDetail,
  contarChamados,
  type PlatformTicket,
} from "@/modules/platform/support-service";

export const dynamic = "force-dynamic";

/** "05/09/2026 às 14:32" no relógio de Brasília. Data quebrada não vira texto quebrado. */
function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  reaberto: "Reaberto",
};

const STATUS_COR: Record<string, string> = {
  aberto: "bg-amber-100 text-amber-800",
  em_andamento: "bg-blue-100 text-blue-800",
  resolvido: "bg-green-100 text-green-800",
  reaberto: "bg-red-100 text-red-800",
};

const CATEGORIA_LABEL: Record<string, string> = {
  pedido: "Pedido",
  entrega: "Entrega",
  pagamento: "Pagamento",
  bug: "Problema no site",
  feedback: "Sugestão",
};

const BADGE = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
const cardClass = "rounded-card border border-border bg-card p-5";

const FILTROS_STATUS = [
  { value: "", label: "Todas as situações" },
  { value: "aberto", label: "Abertos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "reaberto", label: "Reabertos" },
  { value: "resolvido", label: "Resolvidos" },
  { value: "aguardando", label: "Aguardando resposta da loja" },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${BADGE} ${STATUS_COR[status] ?? "bg-secondary text-muted-foreground"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function aplicaFiltros(
  chamados: PlatformTicket[],
  status: string,
  lojaId: string,
  busca: string
): PlatformTicket[] {
  let lista = chamados;

  if (status === "aguardando") {
    lista = lista.filter((c) => c.lastMessageSender === "customer" && c.status !== "resolvido");
  } else if (status) {
    lista = lista.filter((c) => c.status === status);
  }

  if (lojaId) lista = lista.filter((c) => c.tenantId === lojaId);

  const termo = busca.trim().toLowerCase();
  if (termo) {
    lista = lista.filter(
      (c) =>
        c.subject.toLowerCase().includes(termo) ||
        c.buyerName.toLowerCase().includes(termo) ||
        c.buyerEmail.toLowerCase().includes(termo) ||
        c.tenantName.toLowerCase().includes(termo)
    );
  }

  return lista;
}

/** Cartão de contador do topo. Clicar leva à lista já filtrada. */
function Contador({ href, rotulo, valor, destaque }: { href: string; rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-card border bg-card p-4 transition-colors hover:bg-secondary/40 ${
        destaque ? "border-amber-300" : "border-border"
      }`}
    >
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{valor}</p>
    </Link>
  );
}

/** A tarja honesta que explica de quem são estes chamados. Aparece nas duas visões. */
function AvisoDeOrigem() {
  return (
    <div className="mt-4 rounded-card border border-border bg-secondary/40 p-4">
      <p className="text-sm text-foreground">
        <strong>O que você está vendo aqui:</strong> são os chamados que os <strong>clientes compradores</strong>{" "}
        abriram com as lojas — reunidos numa caixa só, de todas as lojas da plataforma. Serve para você enxergar qual
        loja está deixando cliente sem resposta.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        O canal em que <strong>o lojista fala com você, dono da plataforma</strong>, ainda não existe no sistema — ele
        entra numa próxima etapa. Nesta tela a leitura é só leitura: quem responde ao comprador é a própria loja, pelo
        painel dela.
      </p>
    </div>
  );
}

/* ── Visão 2: a conversa completa de um chamado ─────────────────────────── */

async function ConversaDoChamado({ ticketId }: { ticketId: string }) {
  const detalhe = await getPlatformTicketDetail(ticketId);

  if (!detalhe) {
    return (
      <div>
        <Link href="/super/suporte" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para a lista de chamados
        </Link>
        <div className={`${cardClass} mt-4`}>
          <p className="text-sm text-muted-foreground">
            Este chamado não foi encontrado. Ele pode ter sido apagado junto com a loja.{" "}
            <Link href="/super/suporte" className="font-medium text-primary hover:underline">
              Voltar para a lista
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const { ticket, messages } = detalhe;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/super/suporte" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para a lista de chamados
        </Link>
        <h1 className="mt-2 font-display text-2xl text-foreground">{ticket.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <span className={`${BADGE} bg-secondary text-muted-foreground`}>
            {CATEGORIA_LABEL[ticket.category] ?? ticket.category}
          </span>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-foreground">Dados do chamado</h2>
        <div className="mt-2 space-y-2.5 text-sm">
          <p className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground">Loja</span>
            <span className="font-medium text-foreground sm:text-right">
              <Link href={`/super/lojas/${ticket.tenantId}`} className="text-primary hover:underline">
                {ticket.tenantName}
              </Link>
              {ticket.tenantSlug ? ` (/${ticket.tenantSlug})` : ""}
            </span>
          </p>
          <p className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground">Quem abriu</span>
            <span className="font-medium text-foreground sm:text-right">
              {ticket.buyerName} · {ticket.buyerEmail}
            </span>
          </p>
          <p className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground">Aberto em</span>
            <span className="font-medium text-foreground sm:text-right">
              {formatDateTime(ticket.createdAt) ?? "Data indisponível"}
            </span>
          </p>
          <p className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground">Última mensagem</span>
            <span className="font-medium text-foreground sm:text-right">
              {formatDateTime(ticket.lastMessageAt) ?? "Data indisponível"}
            </span>
          </p>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-foreground">Conversa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Somente leitura. Para responder este cliente, é a loja que precisa responder pelo painel dela.
        </p>

        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Este chamado ainda não tem nenhuma mensagem registrada.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map((mensagem) => {
              const daLoja = mensagem.sender === "staff";
              return (
                <li
                  key={mensagem.id}
                  className={`rounded-[10px] border p-3.5 ${
                    daLoja ? "border-border bg-secondary/40" : "border-border bg-background"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {daLoja ? (
                      <Store className="size-3.5 text-muted-foreground" />
                    ) : (
                      <User className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {mensagem.senderName ?? (daLoja ? "Atendimento da loja" : ticket.buyerName)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {daLoja ? "· resposta da loja" : "· mensagem do cliente"}
                    </span>
                    <span className="text-xs text-muted-foreground sm:ml-auto">
                      {formatDateTime(mensagem.createdAt) ?? ""}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">{mensagem.body}</p>
                  {mensagem.attachmentUrl ? (
                    <a
                      href={mensagem.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Ver anexo enviado
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AvisoDeOrigem />
    </div>
  );
}

/* ── Página ─────────────────────────────────────────────────────────────── */

export default async function SuperSuportePage(props: {
  searchParams: Promise<{ chamado?: string; status?: string; loja?: string; busca?: string }>;
}) {
  await requireSuperAdmin();

  const { chamado, status: statusParam, loja: lojaParam, busca: buscaParam } = await props.searchParams;

  // Um chamado escolhido abre a conversa NA MESMA rota (`?chamado=<id>`).
  if (chamado) return <ConversaDoChamado ticketId={chamado} />;

  const todos = await listPlatformTickets();
  const lojas = await listStoresWithTickets(todos);
  const contadores = contarChamados(todos);

  const status = FILTROS_STATUS.some((f) => f.value === (statusParam ?? "")) ? (statusParam ?? "") : "";
  const lojaId = lojas.some((l) => l.id === lojaParam) ? (lojaParam ?? "") : "";
  const busca = (buscaParam ?? "").trim();

  const chamados = aplicaFiltros(todos, status, lojaId, busca);

  const inputClass =
    "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Suporte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Todos os chamados de atendimento de todas as lojas, num lugar só. Clique em um chamado para ler a conversa
        inteira.
      </p>

      {todos.length === 0 ? (
        <>
          <div className={`${cardClass} mt-5 text-center`}>
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">Nenhum chamado de atendimento até agora</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Quando um cliente abrir um chamado com qualquer loja da plataforma, ele aparece aqui automaticamente —
              com o nome da loja, o assunto e a conversa completa. Você não precisa configurar nada.
            </p>
          </div>
          <AvisoDeOrigem />
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5">
            <Contador href="/super/suporte" rotulo="Total de chamados" valor={contadores.total} />
            <Contador
              href="/super/suporte?status=aguardando"
              rotulo="Aguardando resposta da loja"
              valor={contadores.aguardandoResposta}
              destaque={contadores.aguardandoResposta > 0}
            />
            <Contador href="/super/suporte?status=aberto" rotulo="Abertos" valor={contadores.abertos} />
            <Contador
              href="/super/suporte?status=em_andamento"
              rotulo="Em andamento"
              valor={contadores.emAndamento}
            />
            <Contador href="/super/suporte?status=resolvido" rotulo="Resolvidos" valor={contadores.resolvidos} />
          </div>

          <form method="get" className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Buscar</span>
              <input
                type="search"
                name="busca"
                defaultValue={busca}
                placeholder="Assunto, nome ou e-mail do cliente, nome da loja"
                className={inputClass}
              />
            </label>
            <label className="block sm:w-52">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Situação</span>
              <select name="status" defaultValue={status} className={inputClass}>
                {FILTROS_STATUS.map((f) => (
                  <option key={f.value || "todas"} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:w-52">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Loja</span>
              <select name="loja" defaultValue={lojaId} className={inputClass}>
                <option value="">Todas as lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
              Filtrar
            </button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            {chamados.length === 1 ? "1 chamado encontrado" : `${chamados.length} chamados encontrados`}
            {chamados.length !== todos.length ? ` de ${todos.length} no total` : ""}
          </p>

          {chamados.length === 0 ? (
            <div className={`${cardClass} mt-4`}>
              <p className="text-sm text-muted-foreground">
                Nenhum chamado bate com esse filtro.{" "}
                <Link href="/super/suporte" className="font-medium text-primary hover:underline">
                  Ver todos os chamados
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {chamados.map((c) => {
                const aguardando = c.lastMessageSender === "customer" && c.status !== "resolvido";
                return (
                  <Link
                    key={c.id}
                    href={`/super/suporte?chamado=${c.id}`}
                    className="block rounded-card border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{c.subject}</p>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                          <Store className="size-3.5 shrink-0" />
                          {c.tenantName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {c.buyerName} · {c.buyerEmail}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <StatusBadge status={c.status} />
                        <span className={`${BADGE} bg-secondary text-muted-foreground`}>
                          {CATEGORIA_LABEL[c.category] ?? c.category}
                        </span>
                        {aguardando ? (
                          <span className={`${BADGE} bg-amber-100 text-amber-900`}>Aguardando resposta da loja</span>
                        ) : null}
                      </div>
                    </div>

                    {c.lastMessagePreview ? (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
                        <span className="line-clamp-2">
                          {c.lastMessageSender === "staff" ? "A loja respondeu: " : "O cliente escreveu: "}
                          {c.lastMessagePreview}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Este chamado ainda não tem mensagem registrada.
                      </p>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      Aberto em {formatDateTime(c.createdAt) ?? "data indisponível"} · Última movimentação em{" "}
                      {formatDateTime(c.lastMessageAt) ?? "data indisponível"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <AvisoDeOrigem />
        </>
      )}
    </div>
  );
}
