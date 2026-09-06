"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { updatePlatformContent, resetPlatformContent } from "@/modules/platform/landing-actions";
import type { PlatformSection } from "@/modules/platform/landing-content";

/**
 * Editor de UMA seção da landing da plataforma.
 *
 * Mesmo padrão visual e de comportamento dos editores da loja
 * (`src/components/admin/content-list-form.tsx` e `content-fields-form.tsx`).
 * Não dá para reusar aqueles dois: eles são tipados em `StoreSection` e
 * chamam as ações da LOJA, que começam com `requireStaff()` e gravam com o
 * `tenant_id` do staff. Aqui a seção é da plataforma (`tenant_id` nulo) e a
 * trava é `requireSuperAdmin()`.
 *
 * A diferença de desenho que importa: campos soltos e lista da MESMA seção
 * moram num formulário só. Salvar grava a seção inteira -- com dois
 * formulários, salvar um apagaria o outro. Já aconteceu neste projeto.
 */

export type CampoDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: readonly string[];
  placeholder?: string;
  help?: string;
};

export type ListaDef = {
  /** Nome do campo que guarda a lista dentro do payload (ex.: "items"). */
  key: string;
  /** Como chamar UM item na tela ("Pergunta", "Recurso"). */
  itemLabel: string;
  maxItems: number;
  fields: CampoDef[];
  help?: string;
};

type Item = Record<string, string>;

function paraTexto(valor: unknown): string {
  return valor === undefined || valor === null ? "" : String(valor);
}

export function PlatformContentForm({
  section,
  value,
  fields,
  list,
  isCustom,
  help,
}: {
  section: PlatformSection;
  value: Record<string, unknown>;
  fields: CampoDef[];
  list?: ListaDef;
  isCustom: boolean;
  help?: string;
}) {
  const escalaresIniciais = () => {
    const out: Record<string, string> = {};
    for (const f of fields) out[f.key] = paraTexto(value[f.key]);
    return out;
  };
  const listaInicial = (): Item[] => {
    if (!list) return [];
    const bruto = value[list.key];
    if (!Array.isArray(bruto)) return [];
    return bruto.map((linha) => {
      const item: Item = {};
      for (const f of list.fields) item[f.key] = paraTexto((linha as Record<string, unknown>)?.[f.key]);
      return item;
    });
  };

  const [escalares, setEscalares] = useState<Record<string, string>>(escalaresIniciais);
  const [itens, setItens] = useState<Item[]>(listaInicial);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  // NÃO existe efeito copiando a propriedade `value` para o estado.
  //
  // Depois de SALVAR, o estado local já é exatamente o que foi gravado -- não
  // há o que sincronizar, e um efeito ali apagaria o aviso "Salvo" no instante
  // em que o servidor reenviasse a página. O único caso em que o valor do
  // servidor passa a ser diferente do que está na tela é o "Voltar ao texto
  // padrão"; lá a própria função recarrega a página.

  function mudaEscalar(key: string, valor: string) {
    setEscalares((atual) => ({ ...atual, [key]: valor }));
    setSalvo(false);
  }

  function mudaItem(indice: number, key: string, valor: string) {
    setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, [key]: valor } : item)));
    setSalvo(false);
  }

  function move(indice: number, direcao: -1 | 1) {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= itens.length) return;
    const proximo = [...itens];
    [proximo[indice], proximo[alvo]] = [proximo[alvo], proximo[indice]];
    setItens(proximo);
    setSalvo(false);
  }

  function remove(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice));
    setSalvo(false);
  }

  function adiciona() {
    if (!list) return;
    const vazio: Item = {};
    for (const f of list.fields) vazio[f.key] = f.type === "select" ? (f.options?.[0] ?? "") : "";
    setItens((atual) => [...atual, vazio]);
    setSalvo(false);
  }

  function envia(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const payload: Record<string, unknown> = { ...escalares };
      if (list) payload[list.key] = itens;
      const resultado = await updatePlatformContent(section, payload);
      if (!resultado.ok) setErro(resultado.error);
      else setSalvo(true);
    });
  }

  function restaura() {
    if (!confirm("Voltar esta seção para o texto padrão? O que você escreveu aqui será apagado.")) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await resetPlatformContent(section);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      // Recarrega para os campos voltarem a mostrar o texto padrão. É o único
      // momento em que o que está na tela deixa de valer.
      window.location.reload();
    });
  }

  const inputClass =
    "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const areaClass =
    "w-full rounded-[10px] border border-border bg-background px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function desenhaCampo(
    campo: CampoDef,
    valor: string,
    aoMudar: (v: string) => void,
    fundoClaro: boolean
  ) {
    const classeInput = fundoClaro ? inputClass.replace("bg-background", "bg-card") : inputClass;
    const classeArea = fundoClaro ? areaClass.replace("bg-background", "bg-card") : areaClass;

    return (
      <label key={campo.key} className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">{campo.label}</span>
        {campo.type === "textarea" ? (
          <textarea
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
            placeholder={campo.placeholder}
            rows={3}
            className={classeArea}
          />
        ) : campo.type === "select" ? (
          <select value={valor} onChange={(e) => aoMudar(e.target.value)} className={classeInput}>
            {(campo.options ?? []).map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
            placeholder={campo.placeholder}
            className={classeInput}
          />
        )}
        {campo.help ? <span className="mt-1 block text-xs text-muted-foreground">{campo.help}</span> : null}
      </label>
    );
  }

  return (
    <form onSubmit={envia} className="space-y-4">
      {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}

      {fields.map((campo) =>
        desenhaCampo(campo, escalares[campo.key] ?? "", (v) => mudaEscalar(campo.key, v), false)
      )}

      {list ? (
        <div className="space-y-3 border-t border-border pt-4">
          {list.help ? <p className="text-sm text-muted-foreground">{list.help}</p> : null}

          {itens.map((item, indice) => (
            <div key={indice} className="rounded-[10px] border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {list.itemLabel} {indice + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(indice, -1)}
                    disabled={indice === 0}
                    aria-label="Mover para cima"
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(indice, 1)}
                    disabled={indice === itens.length - 1}
                    aria-label="Mover para baixo"
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(indice)}
                    aria-label={`Remover ${list.itemLabel.toLowerCase()} ${indice + 1}`}
                    className="flex size-11 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {list.fields.map((campo) =>
                  desenhaCampo(campo, item[campo.key] ?? "", (v) => mudaItem(indice, campo.key, v), true)
                )}
              </div>
            </div>
          ))}

          {itens.length < list.maxItems ? (
            <button
              type="button"
              onClick={adiciona}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
            >
              <Plus className="size-4" /> Adicionar {list.itemLabel.toLowerCase()}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Máximo de {list.maxItems} {list.itemLabel.toLowerCase()}s nesta seção.
            </p>
          )}
        </div>
      ) : null}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : salvo ? <Check className="size-4" /> : null}
          {salvo ? "Salvo" : "Salvar"}
        </button>
        {isCustom ? (
          <button
            type="button"
            onClick={restaura}
            disabled={pendente}
            className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="size-4" /> Voltar ao texto padrão
          </button>
        ) : null}
      </div>
    </form>
  );
}
