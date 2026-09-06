"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, RotateCcw, Store, XCircle } from "lucide-react";
import { dismissError, restoreError } from "@/modules/platform/errors-actions";

/**
 * Lista de erros da plataforma, com expandir e dispensar.
 *
 * Tudo o que chega aqui é **texto pronto** (inclusive a data já escrita em
 * português e o nome da loja já resolvido). Nada de componente de ícone vindo
 * do servidor: nomes de ícone e classes moram aqui dentro. Passar um
 * componente lucide de um Server Component para um Client Component quebra em
 * produção — regra já paga com incidente em outro projeto.
 */

export type ErrorListItem = {
  id: string;
  /** Já formatado: "hoje às 14:32", "ontem às 09:05", "02/09/2026 às 18:40". */
  quando: string;
  lojaNome: string | null;
  modulo: string;
  acao: string;
  nivel: "warning" | "error" | "critical";
  mensagem: string;
  detalhe: string | null;
  impacto: string | null;
  dispensadoEm: string | null;
  dispensadoPor: string | null;
};

const NIVEL_LABEL: Record<ErrorListItem["nivel"], string> = {
  warning: "Aviso",
  error: "Erro",
  critical: "Crítico",
};

const NIVEL_CLASSE: Record<ErrorListItem["nivel"], string> = {
  warning: "bg-amber-100 text-amber-900",
  error: "bg-red-100 text-red-800",
  critical: "bg-red-600 text-white",
};

const BADGE = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

export function NivelBadge({ nivel }: { nivel: ErrorListItem["nivel"] }) {
  return <span className={`${BADGE} ${NIVEL_CLASSE[nivel]}`}>{NIVEL_LABEL[nivel]}</span>;
}

export function ErrorList({ itens, dispensaDisponivel }: { itens: ErrorListItem[]; dispensaDisponivel: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [abertos, setAbertos] = useState<string[]>([]);
  const [rodando, setRodando] = useState<string | null>(null);
  const [erro, setErro] = useState<{ id: string; mensagem: string } | null>(null);

  function alternar(id: string) {
    setAbertos((atuais) => (atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id]));
  }

  function executar(id: string, fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErro(null);
    setRodando(id);
    startTransition(async () => {
      try {
        const resultado = await fn();
        if (!resultado.ok) {
          setErro({ id, mensagem: resultado.error });
          return;
        }
        router.refresh();
      } catch {
        setErro({ id, mensagem: "A ação não pôde ser concluída. Tente de novo em alguns segundos." });
      } finally {
        setRodando(null);
      }
    });
  }

  return (
    <div className="mt-4 space-y-2">
      {itens.map((item) => {
        const aberto = abertos.includes(item.id);
        const ocupado = pending && rodando === item.id;
        const dispensado = Boolean(item.dispensadoEm);

        return (
          <div
            key={item.id}
            className={`rounded-card border bg-card p-4 ${
              item.nivel === "critical" && !dispensado ? "border-red-300" : "border-border"
            } ${dispensado ? "opacity-70" : ""}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <NivelBadge nivel={item.nivel} />
                  {dispensado ? (
                    <span className={`${BADGE} bg-secondary text-muted-foreground`}>Dispensado</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{item.quando}</span>
                </div>

                <p className="mt-2 font-medium break-words text-foreground">{item.mensagem}</p>

                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="size-3.5 shrink-0" />
                    {item.lojaNome ?? "Plataforma (nenhuma loja específica)"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    Módulo <strong className="font-medium text-foreground">{item.modulo}</strong>
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    Ação <strong className="font-medium text-foreground">{item.acao}</strong>
                  </span>
                </p>

                {item.impacto ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-[10px] bg-secondary px-3 py-2 text-sm text-foreground">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-700" />
                    <span>
                      <strong className="font-medium">O que o cliente percebe:</strong> {item.impacto}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => alternar(item.id)}
                  aria-expanded={aberto}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {aberto ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {aberto ? "Ocultar detalhes" : "Ver detalhes"}
                </button>

                {dispensaDisponivel && !dispensado ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => executar(item.id, () => dismissError(item.id))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    {ocupado ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    Dispensar
                  </button>
                ) : null}

                {dispensaDisponivel && dispensado ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => executar(item.id, () => restoreError(item.id))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    {ocupado ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Trazer de volta
                  </button>
                ) : null}
              </div>
            </div>

            {erro?.id === item.id ? <p className="mt-2 text-sm text-destructive">{erro.mensagem}</p> : null}

            {dispensado ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Dispensado em {item.dispensadoEm}
                {item.dispensadoPor ? ` por ${item.dispensadoPor}` : ""}. O registro continua guardado — nada foi
                apagado.
              </p>
            ) : null}

            {aberto ? (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Detalhes técnicos</p>
                {item.detalhe ? (
                  <pre className="mt-2 max-h-80 overflow-auto rounded-[10px] bg-secondary p-3 text-xs whitespace-pre-wrap text-foreground">
                    {item.detalhe}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Este erro foi registrado sem detalhes técnicos. O que se sabe dele é o que está acima.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Senhas, chaves e tokens são removidos antes de o erro ser gravado — se aparecer{" "}
                  <strong>[removido: parece um segredo]</strong> aqui, é isso que aconteceu.
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
