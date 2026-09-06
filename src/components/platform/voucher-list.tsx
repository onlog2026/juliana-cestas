"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Lock, Trash2 } from "lucide-react";
import { deleteVoucher } from "@/modules/platform/vouchers-actions";

/**
 * Lista de cortesias.
 *
 * A `situacao` já vem CALCULADA do servidor (não existe coluna de status na
 * tabela, de propósito: coluna gravada desatualiza e a tela passa a mentir).
 * Aqui a tela só traduz para português.
 */
type VoucherItem = {
  id: string;
  code: string;
  tenantNome: string | null;
  grantPlanSlug: string | null;
  /** Nomes dos módulos já resolvidos no servidor — o navegador não conhece a tabela. */
  modulosNomes: string[];
  accessDays: number;
  validUntil: string | null;
  maxUses: number;
  usedCount: number;
  redeemedBy: string | null;
  redeemedAt: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  situacao: "disponivel" | "usada" | "expirada";
  jaFoiUsada: boolean;
};

const BADGE = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

const SITUACAO_LABEL: Record<VoucherItem["situacao"], string> = {
  disponivel: "Disponível",
  usada: "Já usada",
  expirada: "Prazo de resgate vencido",
};

const SITUACAO_COR: Record<VoucherItem["situacao"], string> = {
  disponivel: "bg-green-100 text-green-800",
  usada: "bg-secondary text-muted-foreground",
  expirada: "bg-amber-100 text-amber-800",
};

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dataHoraFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return dataFormatter.format(data);
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return dataHoraFormatter.format(data);
}

/** O que a cortesia concede, em uma frase. */
function descreverConcessao(item: VoucherItem): string {
  const partes: string[] = [];
  if (item.grantPlanSlug) partes.push(`plano ${item.grantPlanSlug}`);
  if (item.modulosNomes.length > 0) partes.push(item.modulosNomes.join(", "));
  if (partes.length === 0) return "Nada configurado";
  return partes.join(" + ");
}

export function VoucherList({ vouchers }: { vouchers: VoucherItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copiado, setCopiado] = useState<string | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const [erro, setErro] = useState<{ id: string; mensagem: string } | null>(null);

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(codigo);
      window.setTimeout(() => setCopiado((atual) => (atual === codigo ? null : atual)), 2000);
    } catch {
      setErro({ id: codigo, mensagem: "O navegador não deixou copiar. Selecione o código e copie na mão." });
    }
  }

  function apagar(item: VoucherItem) {
    const ok = window.confirm(
      `Apagar a cortesia ${item.code}?\n\nEla some da lista e ninguém mais consegue resgatar esse código. Esta ação não tem volta.`
    );
    if (!ok) return;
    setErro(null);
    setApagando(item.id);
    startTransition(async () => {
      try {
        const resultado = await deleteVoucher(item.id);
        if (!resultado.ok) {
          setErro({ id: item.id, mensagem: resultado.error });
          return;
        }
        router.refresh();
      } catch {
        setErro({ id: item.id, mensagem: "Não foi possível apagar agora. Tente de novo em alguns segundos." });
      } finally {
        setApagando(null);
      }
    });
  }

  if (vouchers.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Nenhuma cortesia foi criada ainda. Use o formulário acima para gerar a primeira.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vouchers.map((item) => {
        const ocupado = pending && apagando === item.id;
        return (
          <div key={item.id} className="rounded-card border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-[10px] border border-border bg-background px-2.5 py-1 font-mono text-sm font-semibold tracking-wider text-foreground">
                    {item.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copiar(item.code)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    {copiado === item.code ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiado === item.code ? "Copiado" : "Copiar"}
                  </button>
                  <span className={`${BADGE} ${SITUACAO_COR[item.situacao]}`}>{SITUACAO_LABEL[item.situacao]}</span>
                </div>

                <p className="mt-2 text-sm text-foreground">
                  <span className="text-muted-foreground">Para: </span>
                  {item.tenantNome ?? "Qualquer loja"}
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Concede: </span>
                  {descreverConcessao(item)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.accessDays} {item.accessDays === 1 ? "dia" : "dias"} de acesso a partir do resgate ·{" "}
                  {item.validUntil ? `resgatar até ${formatarData(item.validUntil)}` : "sem prazo para resgatar"} ·{" "}
                  {item.usedCount} de {item.maxUses} {item.maxUses === 1 ? "uso" : "usos"}
                </p>
                {item.note ? <p className="mt-1 text-sm text-muted-foreground">Motivo: {item.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Criada por {item.createdBy ?? "origem não registrada"} em {formatarDataHora(item.createdAt)}
                  {item.redeemedAt || item.redeemedBy
                    ? ` · resgatada por ${item.redeemedBy ?? "não registrado"} em ${formatarDataHora(item.redeemedAt)}`
                    : " · ainda não resgatada"}
                </p>
              </div>

              <div className="shrink-0 sm:text-right">
                {item.jaFoiUsada ? (
                  <>
                    <button
                      type="button"
                      disabled
                      title="Cortesia já resgatada não pode ser apagada."
                      className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-medium text-muted-foreground opacity-70"
                    >
                      <Lock className="size-3.5" />
                      Não pode apagar
                    </button>
                    <p className="mt-1.5 max-w-[15rem] text-xs text-muted-foreground sm:ml-auto">
                      Esta cortesia já foi resgatada. Ela fica na lista para sempre porque é o comprovante de quem
                      ganhou acesso de graça, quando e por ordem de quem.
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => apagar(item)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-300 bg-card px-3.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    Apagar cortesia
                  </button>
                )}
              </div>
            </div>

            {erro && (erro.id === item.id || erro.id === item.code) ? (
              <p className="mt-2 text-sm text-destructive">{erro.mensagem}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
