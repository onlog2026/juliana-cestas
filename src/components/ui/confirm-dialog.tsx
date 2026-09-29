"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Confirmação padrão do painel: uma caixa no MEIO da tela (nunca o `confirm()`
 * do navegador, que some no celular e no app instalado). Usa `<dialog>` nativo:
 * o foco fica preso na caixa e o Esc fecha, sem código extra.
 *
 *   const confirm = useConfirm();
 *   const r = await confirm({ title: "Excluir?", tone: "danger" });
 *   if (!r.ok) return;
 *
 * Opções úteis: `input` (campo de texto, ex. motivo -> r.value),
 * `requireText` (só habilita o botão quando a pessoa digita exatamente isso),
 * `choices` (escolha entre alternativas, ex. "só este / todos do grupo" -> r.choice).
 */
export type ConfirmChoice = { value: string; label: string; hint?: string };

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /** Mostra um campo de texto; o que foi digitado volta em `value`. */
  input?: { label: string; placeholder?: string; optional?: boolean };
  /** Só libera o botão quando o texto digitado for igual a este. */
  requireText?: { text: string; label?: string };
  /** Alternativas (radio); a escolhida volta em `choice`. A primeira vem marcada. */
  choices?: ConfirmChoice[];
};

export type ConfirmResult = { ok: boolean; value?: string; choice?: string };

type Ask = (options: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = createContext<Ask | null>(null);

export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>.");
  return ask;
}

type Pending = { options: ConfirmOptions; resolve: (r: ConfirmResult) => void };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [choice, setChoice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>(
    (options) =>
      new Promise<ConfirmResult>((resolve) => {
        setText("");
        setTyped("");
        setChoice(options.choices?.[0]?.value ?? "");
        setPending({ options, resolve });
      }),
    []
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) {
      dialog.showModal();
      // Foco inicial no "Cancelar": Enter sem querer nunca confirma algo destrutivo.
      cancelRef.current?.focus();
    }
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  function finish(result: ConfirmResult) {
    pending?.resolve(result);
    setPending(null);
  }

  const o = pending?.options;
  const danger = o?.tone === "danger";
  const blocked =
    Boolean(o?.requireText) && typed.trim() !== o?.requireText?.text
      ? true
      : Boolean(o?.input) && !o?.input?.optional && !text.trim();

  const value = useMemo(() => ask, [ask]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          // Esc = "não".
          e.preventDefault();
          finish({ ok: false });
        }}
        onClick={(e) => {
          // Clique no fundo escuro = "não".
          if (e.target === dialogRef.current) finish({ ok: false });
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        {o ? (
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              if (blocked) return;
              finish({ ok: true, value: text.trim(), choice: choice || undefined });
            }}
            className="p-5"
          >
            <h2 className="font-display text-lg text-foreground">{o.title}</h2>
            {o.description ? <div className="mt-2 text-sm text-muted-foreground">{o.description}</div> : null}

            {o.choices?.length ? (
              <fieldset className="mt-4 space-y-2">
                {o.choices.map((c) => (
                  <label
                    key={c.value}
                    className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="confirm-choice"
                      value={c.value}
                      checked={choice === c.value}
                      onChange={() => setChoice(c.value)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium text-foreground">{c.label}</span>
                      {c.hint ? <span className="block text-xs text-muted-foreground">{c.hint}</span> : null}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : null}

            {o.input ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-foreground">{o.input.label}</span>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={o.input.placeholder}
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-base"
                />
              </label>
            ) : null}

            {o.requireText ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-foreground">
                  {o.requireText.label ?? `Para confirmar, digite ${o.requireText.text}`}
                </span>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-base"
                />
              </label>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => finish({ ok: false })}
                className="h-11 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {o.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="submit"
                disabled={blocked}
                className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-50 ${
                  danger
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {o.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </ConfirmContext.Provider>
  );
}

/** Ícone de "processando" para botões que usam o resultado do diálogo. */
export function Spinner() {
  return <Loader2 className="size-4 animate-spin" />;
}

/**
 * Atalho para textos que já vinham prontos para o `confirm()` antigo: o
 * primeiro parágrafo vira o título e o resto vira a descrição (quebras de
 * linha preservadas). Devolve `true` se a pessoa confirmou.
 */
export function useConfirmText(): (texto: string, opcoes?: Pick<ConfirmOptions, "tone" | "confirmLabel">) => Promise<boolean> {
  const ask = useConfirm();
  return useCallback(
    async (texto, opcoes) => {
      const [titulo, ...resto] = texto.split(/\n\n+/);
      const corpo = resto.join("\n\n");
      const r = await ask({
        title: titulo,
        description: corpo ? <span className="whitespace-pre-line">{corpo}</span> : undefined,
        ...opcoes,
      });
      return r.ok;
    },
    [ask]
  );
}
