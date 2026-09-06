"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { gerarConteudoProdutoComIA } from "@/modules/ai/actions";

/**
 * BOTÃO "Preencher com IA".
 *
 * De propósito, este componente não sabe NADA sobre o formulário de produto
 * que existe hoje (`product-details-form.tsx`) -- ele recebe o que precisa por
 * props (nome, itens, foto) e devolve o resultado por `onGenerated`. Quem
 * encaixa o botão no formulário escreve o `onGenerated` chamando os `setX` dos
 * campos de descrição/SEO/legenda daquela tela. Ver o relatório da tarefa para
 * onde encaixar e o mapeamento exato de campos.
 *
 * Regra do projeto: nunca passar função/ícone de servidor para cliente -- aqui
 * não tem problema porque o componente inteiro é "use client".
 */

export type AiGeneratedContent = {
  descricaoLonga: string;
  descricaoCurta: string;
  seoTitulo: string;
  seoDescricao: string;
  altTexto: string;
  legendaRedeSocial: string;
};

const SUGESTOES_TOM = ["Caloroso e acolhedor", "Elegante e sofisticado", "Alegre e descontraído", "Direto e objetivo"];

export function AiFillButton({
  productId,
  nomeAtual,
  itensAtuais,
  imagemAtual,
  onGenerated,
}: {
  /** Id do produto já salvo, ou `null` para uma cesta ainda não salva. */
  productId: string | null;
  /** Nome digitado no formulário NESTE momento (não recarrega do banco). */
  nomeAtual: string;
  /** Itens digitados no formulário NESTE momento, um por linha já separada. */
  itensAtuais: string[];
  /** URL da foto de capa já enviada, se houver -- ajuda a IA a descrever melhor. */
  imagemAtual?: string;
  /** Chamado com o conteúdo pronto; quem usa decide em quais campos colocar. */
  onGenerated: (content: AiGeneratedContent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ocasiao, setOcasiao] = useState("");
  const [tom, setTom] = useState(SUGESTOES_TOM[0]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nome = nomeAtual.trim();
  const itens = itensAtuais.map((i) => i.trim()).filter(Boolean);

  function abrir() {
    setError(null);
    if (!nome) {
      setError("Preencha o nome da cesta antes de usar a IA.");
      return;
    }
    if (itens.length === 0) {
      setError("Liste o que vem na cesta (um item por linha) antes de usar a IA.");
      return;
    }
    setOpen(true);
  }

  function gerar() {
    setError(null);
    startTransition(async () => {
      const result = await gerarConteudoProdutoComIA({
        productId,
        nome,
        itens,
        ocasiao,
        tom,
        imageUrl: imagemAtual ?? "",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onGenerated(result.content);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex h-11 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary hover:bg-primary/15"
      >
        <Sparkles className="size-4" />
        Preencher com IA
      </button>

      {error && !open ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.5)] p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-fill-titulo"
        >
          <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-card bg-card p-5 sm:max-w-md sm:rounded-card sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="ai-fill-titulo" className="flex items-center gap-2 font-display text-xl text-foreground">
                <Sparkles className="size-5 text-primary" />
                Preencher com IA
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                disabled={pending}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              A IA vai escrever a descrição longa, a descrição curta, o título e a descrição de SEO, o texto
              alternativo da foto e uma legenda para rede social -- usando o nome, os itens e a foto de capa
              já preenchidos nesta cesta.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Ocasião (opcional)</span>
                <input
                  value={ocasiao}
                  onChange={(e) => setOcasiao(e.target.value)}
                  placeholder="Aniversário, Dia das Mães, agradecimento..."
                  disabled={pending}
                  className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Tom desejado</span>
                <select
                  value={tom}
                  onChange={(e) => setTom(e.target.value)}
                  disabled={pending}
                  className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SUGESTOES_TOM.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-[10px] border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">O que a IA vai usar:</p>
                <p className="mt-1">
                  <span className="font-medium text-foreground">{nome}</span> — {itens.join(", ")}
                </p>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={pending}
                onClick={gerar}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {pending ? "Gerando..." : "Gerar conteúdo"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
