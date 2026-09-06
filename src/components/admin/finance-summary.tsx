import Link from "next/link";
import { Wallet, Clock, TriangleAlert, RefreshCw, Link2Off } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { FinanceStatus } from "@/modules/finance/service";

/**
 * Bloco de saldo e recebíveis do Asaas da própria loja.
 *
 * Componente de servidor puro (sem estado): o botão "Atualizar agora" é um
 * link comum para a própria página com `?atualizar=1` — não precisa de
 * JavaScript no navegador para forçar uma consulta nova ao Asaas.
 *
 * Três estados possíveis, e a tela nunca finge saber o que não sabe:
 *   1. loja sem conta conectada -> explica e manda para /admin/pagamentos;
 *   2. loja conectada, consulta OK -> mostra o saldo e a data da consulta;
 *   3. loja conectada, consulta falhou -> mostra o ÚLTIMO snapshot salvo,
 *      com a data dele e o motivo do erro (nunca zero no lugar de "não sei").
 */

function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const DATA_HORA_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "dd/mm hh:mm", sem a vírgula que `toLocaleString` insere dependendo do ICU. */
function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const partes = DATA_HORA_FORMATTER.formatToParts(d);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")}/${valor("month")} ${valor("hour")}:${valor("minute")}`;
}

export function FinanceSummary({
  status,
  refreshHref,
}: {
  status: FinanceStatus;
  /** Endereço da própria página com `?atualizar=1` (preserva os filtros de data). */
  refreshHref: string;
}) {
  if (!status.connected) {
    return (
      <div className="rounded-card border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <Link2Off className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Nenhuma conta de recebimento conectada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Para ver saldo e recebíveis aqui, conecte a conta Asaas da sua loja. Enquanto isso, esta seção
              fica vazia de propósito — não é um erro, é porque ainda não há conta para consultar.
            </p>
            <Link
              href="/admin/pagamentos"
              className="mt-3 inline-flex h-10 items-center rounded-[10px] border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
            >
              Conectar em Pagamentos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { snapshot, erroAtualizacao } = status;

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Saldo e recebíveis no Asaas</h2>
        <Link
          href={refreshHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-background px-3.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <RefreshCw className="size-3.5" /> Atualizar agora
        </Link>
      </div>

      {erroAtualizacao ? (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-destructive/40 bg-destructive/5 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            Não foi possível atualizar agora ({erroAtualizacao}).
            {snapshot
              ? ` Os números abaixo são da última consulta que funcionou, em ${formatarDataBr(snapshot.date)}.`
              : " E ainda não existe nenhuma consulta anterior salva para esta loja."}
          </p>
        </div>
      ) : null}

      {snapshot ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4" /> Saldo na conta Asaas
            </div>
            <p className="mt-2 font-display text-2xl text-foreground">{formatCents(snapshot.balanceCents)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> A receber (cobranças pendentes)
            </div>
            <p className="mt-2 font-display text-2xl text-foreground">{formatCents(snapshot.pendingCents)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não conseguimos nenhuma consulta ao Asaas para mostrar aqui.
        </p>
      )}

      {snapshot ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Consultado em {formatarDataHora(snapshot.createdAt)}. Atualiza sozinho uma vez por dia; use
          &quot;Atualizar agora&quot; para forçar uma consulta nova.
        </p>
      ) : null}
    </div>
  );
}
