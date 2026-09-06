"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Info } from "lucide-react";
import { savePlanModules } from "@/modules/platform/plans-actions";

/**
 * Matriz "este plano × cada módulo do sistema".
 *
 * A armadilha nº 1 desta tela (documentada em docs/SUPER-ADMIN-SPEC.md):
 * no Agentop existia UM campo de limite, de texto livre, que parecia trava e
 * não travava nada -- o dono escrevia "500 produtos", via escrito na tela e
 * achava que o sistema estava limitando. Não estava.
 *
 * Por isso aqui são DOIS campos, com nome explícito:
 *  - "Texto que o cliente lê"  -> só aparece na vitrine, não trava nada;
 *  - "Limite que o sistema obedece" -> o número que o servidor realmente usa.
 */

type StatusModulo = "included" | "addon" | "excluded";

export type MatrixRow = {
  moduleSlug: string;
  name: string;
  description: string | null;
  category: string;
  isCore: boolean;
  status: StatusModulo;
  limitDisplay: string;
  limitValueTexto: string;
};

const OPCOES: { valor: StatusModulo; rotulo: string; explicacao: string }[] = [
  { valor: "included", rotulo: "Incluído", explicacao: "Já vem no plano, sem cobrar nada a mais." },
  { valor: "addon", rotulo: "Vender à parte", explicacao: "A loja só usa se contratar este item separado." },
  { valor: "excluded", rotulo: "Não tem", explicacao: "Não faz parte deste plano de jeito nenhum." },
];

const inputClass =
  "h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60";

export function PlanModuleMatrix({
  planId,
  planName,
  linhas,
}: {
  planId: string;
  planName: string;
  linhas: MatrixRow[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<MatrixRow[]>(linhas);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const incluidos = estado.filter((l) => l.status === "included").length;
  const aParte = estado.filter((l) => l.status === "addon").length;
  const fora = estado.filter((l) => l.status === "excluded").length;

  // Dois setters separados de propósito: o campo "situação" só aceita as três
  // opções conhecidas, e o TypeScript garante isso -- os campos de texto
  // aceitam texto livre.
  function mudarSituacao(slug: string, valor: StatusModulo) {
    setEstado((atual) =>
      atual.map((linha) => (linha.moduleSlug === slug ? { ...linha, status: valor } : linha))
    );
  }

  function mudarTexto(slug: string, campo: "limitDisplay" | "limitValueTexto", valor: string) {
    setEstado((atual) =>
      atual.map((linha) =>
        linha.moduleSlug === slug
          ? campo === "limitDisplay"
            ? { ...linha, limitDisplay: valor }
            : { ...linha, limitValueTexto: valor }
          : linha
      )
    );
  }

  function salvar() {
    setErro(null);
    setSucesso(null);
    iniciarTransicao(async () => {
      try {
        const resultado = await savePlanModules(
          planId,
          estado.map((l) => ({
            moduleSlug: l.moduleSlug,
            status: l.status,
            limitDisplay: l.limitDisplay,
            limitValueTexto: l.limitValueTexto,
          }))
        );
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setSucesso("Salvo. O que este plano libera já vale a partir de agora.");
        router.refresh();
      } catch {
        setErro("Não foi possível salvar. Tente de novo em alguns segundos.");
      }
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">O que o plano {planName} libera</h3>
          <p className="text-xs text-muted-foreground">
            {incluidos} {incluidos === 1 ? "módulo incluído" : "módulos incluídos"} · {aParte}{" "}
            {aParte === 1 ? "vendido à parte" : "vendidos à parte"} · {fora} fora do plano
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="h-9 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          {aberto ? "Fechar a lista de módulos" : "Ver e mudar os módulos"}
        </button>
      </div>

      {aberto ? (
        <>
          {/* A frase que impede o erro mais caro desta tela. */}
          <div className="mt-3 flex gap-2 rounded-[10px] bg-amber-100 px-3 py-2.5 text-sm text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              São duas coisas diferentes: <strong>&quot;Texto que o cliente lê&quot;</strong> é só a frase que aparece
              na vitrine e <strong>não limita nada</strong>; <strong>&quot;Limite que o sistema obedece&quot;</strong>{" "}
              é o número que trava de verdade. Se você escrever &quot;até 500 produtos&quot; e deixar o número vazio, a
              loja poderá cadastrar produtos sem limite nenhum.
            </p>
          </div>

          {/* A tabela rola dentro desta caixa. A página nunca rola de lado. */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="w-[26%] py-2 pr-3 font-medium text-muted-foreground">Módulo</th>
                  <th className="w-[30%] py-2 pr-3 font-medium text-muted-foreground">Neste plano</th>
                  <th className="w-[22%] py-2 pr-3 font-medium text-muted-foreground">
                    Texto que o cliente lê
                    <span className="block text-xs font-normal">só aparece na vitrine</span>
                  </th>
                  <th className="w-[22%] py-2 font-medium text-muted-foreground">
                    Limite que o sistema obedece
                    <span className="block text-xs font-normal">vazio = sem limite</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {estado.map((linha) => (
                  <tr key={linha.moduleSlug} className="border-b border-border align-top">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-foreground">{linha.name}</p>
                      {linha.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{linha.description}</p>
                      ) : null}
                    </td>

                    <td className="py-3 pr-3">
                      {linha.isCore ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <Lock className="size-3.5" /> Sempre incluído
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {OPCOES.map((opcao) => {
                            const marcado = linha.status === opcao.valor;
                            return (
                              <button
                                key={opcao.valor}
                                type="button"
                                aria-pressed={marcado}
                                title={opcao.explicacao}
                                onClick={() => mudarSituacao(linha.moduleSlug, opcao.valor)}
                                className={`h-9 rounded-full border px-3 text-xs font-medium transition-colors ${
                                  marcado
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:bg-accent"
                                }`}
                              >
                                {opcao.rotulo}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {linha.isCore ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Faz parte do núcleo da plataforma: nenhuma loja fica sem, então não se vende à parte.
                        </p>
                      ) : null}
                    </td>

                    <td className="py-3 pr-3">
                      <input
                        value={linha.limitDisplay}
                        onChange={(e) => mudarTexto(linha.moduleSlug, "limitDisplay", e.target.value)}
                        placeholder="até 500 produtos"
                        aria-label={`Texto que o cliente lê no módulo ${linha.name}`}
                        className={inputClass}
                      />
                    </td>

                    <td className="py-3">
                      <input
                        inputMode="numeric"
                        value={linha.limitValueTexto}
                        onChange={(e) => mudarTexto(linha.moduleSlug, "limitValueTexto", e.target.value)}
                        placeholder="sem limite"
                        aria-label={`Limite que o sistema obedece no módulo ${linha.name}`}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={pendente} onClick={salvar} className={primaryButton}>
              {pendente ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar o que este plano libera
            </button>
            <p className="text-xs text-muted-foreground">
              Vale para todas as lojas que estiverem neste plano, na hora.
            </p>
          </div>

          {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}
          {sucesso ? <p className="mt-3 text-sm text-green-700">{sucesso}</p> : null}
        </>
      ) : null}
    </div>
  );
}
