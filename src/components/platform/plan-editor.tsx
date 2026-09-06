"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, EyeOff, Eye } from "lucide-react";
import { createPlan, updatePlan, deletePlan, setPlanVisibility } from "@/modules/platform/plans-actions";

/**
 * Formulário de um plano (criar e editar).
 *
 * Regra de ouro deste arquivo: **o preço é digitado em REAIS e gravado em
 * CENTAVOS, e quem faz a conversão é o servidor**. Este componente não
 * calcula centavos nem "arruma" o número -- ele manda o texto exatamente como
 * a pessoa escreveu ("129,90") e o servidor converte com a função que tem
 * teste. Assim não existe nenhum caminho em que o navegador decide o preço.
 */

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const neutralButton =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60";
const dangerButton =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-red-300 bg-card px-5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60";

/** Tudo texto: é o que o formulário mostra e o que ele devolve ao servidor. */
export type PlanEditorValues = {
  id: string | null;
  slug: string;
  name: string;
  badge: string;
  description: string;
  /** Em reais, com vírgula. Exemplo: "129,90". */
  precoMensalTexto: string;
  descontoAnualTexto: string;
  maxProductsTexto: string;
  maxTeamMembersTexto: string;
  sortOrderTexto: string;
  isVisible: boolean;
  isAnchor: boolean;
};

const VAZIO: PlanEditorValues = {
  id: null,
  slug: "",
  name: "",
  badge: "",
  description: "",
  precoMensalTexto: "",
  descontoAnualTexto: "0",
  maxProductsTexto: "",
  maxTeamMembersTexto: "",
  sortOrderTexto: "0",
  isVisible: true,
  isAnchor: false,
};

function Campo({
  rotulo,
  ajuda,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{rotulo}</span>
      {children}
      {ajuda ? <span className="mt-1 block text-xs text-muted-foreground">{ajuda}</span> : null}
    </label>
  );
}

function FormularioDoPlano({
  inicial,
  lojasUsando,
  aoFechar,
}: {
  inicial: PlanEditorValues;
  lojasUsando: number;
  aoFechar?: () => void;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [valores, setValores] = useState<PlanEditorValues>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [rodando, setRodando] = useState<string | null>(null);

  const criando = inicial.id === null;

  function mudar<K extends keyof PlanEditorValues>(campo: K, valor: PlanEditorValues[K]) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function executar(acao: string, mensagem: string, fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErro(null);
    setSucesso(null);
    setRodando(acao);
    iniciarTransicao(async () => {
      try {
        const resultado = await fn();
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setSucesso(mensagem);
        router.refresh();
        if (acao === "criar" && aoFechar) aoFechar();
      } catch {
        setErro("A ação não pôde ser concluída. Tente de novo em alguns segundos.");
      } finally {
        setRodando(null);
      }
    });
  }

  function ocupado(acao: string) {
    return pendente && rodando === acao;
  }

  function salvar() {
    const entrada = {
      slug: valores.slug,
      name: valores.name,
      badge: valores.badge,
      description: valores.description,
      precoMensalTexto: valores.precoMensalTexto,
      descontoAnualTexto: valores.descontoAnualTexto,
      maxProductsTexto: valores.maxProductsTexto,
      maxTeamMembersTexto: valores.maxTeamMembersTexto,
      sortOrderTexto: valores.sortOrderTexto,
      isVisible: valores.isVisible,
      isAnchor: valores.isAnchor,
    };
    if (criando) {
      executar("criar", "Plano criado.", () => createPlan(entrada));
    } else {
      executar("salvar", "Plano salvo.", () => updatePlan(inicial.id as string, entrada));
    }
  }

  const travadoPorUso = lojasUsando > 0;
  const fraseDeUso =
    lojasUsando === 1
      ? "1 loja usa este plano. Mude essa loja de plano antes de excluir."
      : `${lojasUsando} lojas usam este plano. Mude essas lojas de plano antes de excluir.`;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome do plano" ajuda="É o nome que o cliente vê na vitrine. Exemplo: Essencial.">
          <input
            value={valores.name}
            onChange={(e) => mudar("name", e.target.value)}
            placeholder="Essencial"
            className={inputClass}
          />
        </Campo>

        <Campo
          rotulo="Identificador do plano"
          ajuda={
            criando
              ? "Deixe vazio para o sistema criar a partir do nome. É a chave que liga a loja ao plano — sem acento e sem espaço."
              : travadoPorUso
                ? "Não pode ser trocado enquanto existir loja neste plano: é por ele que a loja é ligada ao plano."
                : "Sem acento e sem espaço. É a chave que liga a loja ao plano."
          }
        >
          <input
            value={valores.slug}
            onChange={(e) => mudar("slug", e.target.value)}
            placeholder="essencial"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Preço mensal (R$)" ajuda="Só o valor, com vírgula. Exemplo: 129,90. Escreva 0 para plano gratuito.">
          <input
            inputMode="decimal"
            value={valores.precoMensalTexto}
            onChange={(e) => mudar("precoMensalTexto", e.target.value)}
            placeholder="129,90"
            className={inputClass}
          />
        </Campo>

        <Campo
          rotulo="Desconto no plano anual (%)"
          ajuda="Quanto o mês fica mais barato quando a loja paga o ano inteiro. Exemplo: 20."
        >
          <input
            inputMode="decimal"
            value={valores.descontoAnualTexto}
            onChange={(e) => mudar("descontoAnualTexto", e.target.value)}
            placeholder="20"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Limite de produtos" ajuda="Número inteiro. Deixe vazio para não ter limite.">
          <input
            inputMode="numeric"
            value={valores.maxProductsTexto}
            onChange={(e) => mudar("maxProductsTexto", e.target.value)}
            placeholder="Sem limite"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Limite de pessoas na equipe" ajuda="Número inteiro. Deixe vazio para não ter limite.">
          <input
            inputMode="numeric"
            value={valores.maxTeamMembersTexto}
            onChange={(e) => mudar("maxTeamMembersTexto", e.target.value)}
            placeholder="Sem limite"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Selo do plano" ajuda="Texto curto que aparece no card. Exemplo: Mais vendido. Pode ficar vazio.">
          <input
            value={valores.badge}
            onChange={(e) => mudar("badge", e.target.value)}
            placeholder="Mais vendido"
            className={inputClass}
          />
        </Campo>

        <Campo rotulo="Ordem de exibição" ajuda="Quem tem número menor aparece primeiro na vitrine.">
          <input
            inputMode="numeric"
            value={valores.sortOrderTexto}
            onChange={(e) => mudar("sortOrderTexto", e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </Campo>
      </div>

      <Campo rotulo="Descrição" ajuda="Uma frase explicando para quem é este plano.">
        <textarea
          value={valores.description}
          onChange={(e) => mudar("description", e.target.value)}
          rows={2}
          placeholder="Para quem está começando a vender pela internet."
          className="w-full rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Campo>

      <div className="mt-3 space-y-2">
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={valores.isVisible}
            onChange={(e) => mudar("isVisible", e.target.checked)}
            className="mt-0.5 size-4"
          />
          <span>
            Aparecer na vitrine de planos
            <span className="block text-xs text-muted-foreground">
              Desmarcado, o plano continua funcionando para quem já está nele, mas ninguém novo consegue escolher.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={valores.isAnchor}
            onChange={(e) => mudar("isAnchor", e.target.checked)}
            className="mt-0.5 size-4"
          />
          <span>
            Destacar como &quot;mais popular&quot;
            <span className="block text-xs text-muted-foreground">
              Só um plano pode ser o destaque. Ao marcar este, o destaque sai automaticamente do plano que estiver
              marcado hoje.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pendente} onClick={salvar} className={primaryButton}>
          {ocupado("criar") || ocupado("salvar") ? <Loader2 className="size-4 animate-spin" /> : null}
          {criando ? "Criar plano" : "Salvar alterações"}
        </button>

        {aoFechar ? (
          <button type="button" disabled={pendente} onClick={aoFechar} className={neutralButton}>
            Cancelar
          </button>
        ) : null}

        {!criando ? (
          <button
            type="button"
            disabled={pendente}
            onClick={() => {
              const ok = window.confirm(
                inicial.isVisible
                  ? `Tirar o plano "${inicial.name}" da vitrine?\n\nQuem já está neste plano continua igual. O plano só deixa de ser oferecido para quem ainda vai assinar.`
                  : `Colocar o plano "${inicial.name}" de volta na vitrine?\n\nEle volta a ser oferecido para novas lojas.`
              );
              if (!ok) return;
              executar(
                "visibilidade",
                inicial.isVisible ? "Plano retirado da vitrine." : "Plano publicado na vitrine.",
                () => setPlanVisibility(inicial.id as string, !inicial.isVisible)
              );
            }}
            className={neutralButton}
          >
            {ocupado("visibilidade") ? (
              <Loader2 className="size-4 animate-spin" />
            ) : inicial.isVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {inicial.isVisible ? "Tirar da vitrine" : "Publicar na vitrine"}
          </button>
        ) : null}

        {!criando ? (
          <button
            type="button"
            disabled={pendente || travadoPorUso}
            title={travadoPorUso ? fraseDeUso : undefined}
            onClick={() => {
              const ok = window.confirm(
                `Excluir o plano "${inicial.name}" para sempre?\n\nIsso apaga o plano e tudo que ele libera. Não dá para desfazer. Se você só quer parar de vender este plano, use "Tirar da vitrine".`
              );
              if (!ok) return;
              executar("excluir", "Plano excluído.", () => deletePlan(inicial.id as string));
            }}
            className={dangerButton}
          >
            {ocupado("excluir") ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Excluir plano
          </button>
        ) : null}
      </div>

      {!criando && travadoPorUso ? (
        <p className="mt-2 text-xs text-muted-foreground">
          O botão de excluir está bloqueado: {fraseDeUso}
        </p>
      ) : null}

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}
      {sucesso ? <p className="mt-3 text-sm text-green-700">{sucesso}</p> : null}
    </div>
  );
}

/** Editor de um plano que já existe: começa fechado, abre no botão "Editar". */
export function PlanEditor({ plano, lojasUsando }: { plano: PlanEditorValues; lojasUsando: number }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${neutralButton} mt-4 h-9 px-4 text-sm`}
      >
        Editar este plano
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className={`${neutralButton} mt-4 h-9 px-4 text-sm`}
      >
        Fechar edição
      </button>
      <FormularioDoPlano inicial={plano} lojasUsando={lojasUsando} />
    </>
  );
}

/** Criação de plano novo: um botão que abre o mesmo formulário, em branco. */
export function NewPlanEditor() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={primaryButton}>
        <Plus className="size-4" /> Criar plano novo
      </button>
    );
  }

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Novo plano</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Preencha os dados do plano. Depois de criado, você define nele o que cada módulo faz na matriz abaixo.
      </p>
      <FormularioDoPlano inicial={VAZIO} lojasUsando={0} aoFechar={() => setAberto(false)} />
    </div>
  );
}
