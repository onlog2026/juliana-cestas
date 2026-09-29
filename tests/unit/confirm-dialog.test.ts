// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createElement, useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmProvider, useConfirm, type ConfirmOptions, type ConfirmResult } from "@/components/ui/confirm-dialog";

// jsdom não implementa <dialog>.showModal/close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => cleanup());

function Harness({ options }: { options: ConfirmOptions }) {
  const confirm = useConfirm();
  const [result, setResult] = useState<ConfirmResult | null>(null);
  return createElement(
    "div",
    null,
    createElement("button", { onClick: async () => setResult(await confirm(options)) }, "abrir"),
    createElement("output", { "data-testid": "res" }, result ? JSON.stringify(result) : "nada")
  );
}

function mount(options: ConfirmOptions) {
  render(createElement(ConfirmProvider, null, createElement(Harness, { options })));
  fireEvent.click(screen.getByText("abrir"));
}
const res = () => screen.getByTestId("res").textContent;

describe("ConfirmDialog", () => {
  it("confirmar devolve ok:true", async () => {
    mount({ title: "Excluir?", confirmLabel: "Sim" });
    fireEvent.click(await screen.findByText("Sim"));
    await waitFor(() => expect(JSON.parse(res()!).ok).toBe(true));
  });

  it("cancelar devolve ok:false", async () => {
    mount({ title: "Excluir?" });
    fireEvent.click(await screen.findByText("Cancelar"));
    await waitFor(() => expect(JSON.parse(res()!).ok).toBe(false));
  });

  it("requireText mantém o botão desabilitado até digitar o texto exato", async () => {
    mount({ title: "Excluir?", confirmLabel: "Excluir", requireText: { text: "1010" } });
    const btn = (await screen.findByText("Excluir", { selector: "button" })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1011" } });
    expect(btn.disabled).toBe(true);
    fireEvent.change(input, { target: { value: "1010" } });
    expect(btn.disabled).toBe(false);
  });

  it("campo de texto e escolha voltam no resultado; a primeira escolha vem marcada", async () => {
    mount({
      title: "Cancelar?",
      confirmLabel: "Ok",
      input: { label: "Motivo", optional: true },
      choices: [
        { value: "one", label: "Só esta" },
        { value: "all", label: "Todas" },
      ],
    });
    await screen.findByText("Cancelar?");
    fireEvent.change(document.querySelector('input[type="text"], input:not([type])') as HTMLInputElement, {
      target: { value: "desistiu" },
    });
    fireEvent.click(screen.getByLabelText(/Todas/));
    fireEvent.click(screen.getByText("Ok"));
    await waitFor(() => expect(JSON.parse(res()!)).toEqual({ ok: true, value: "desistiu", choice: "all" }));
  });

  it("campo obrigatório vazio bloqueia a confirmação", async () => {
    mount({ title: "Motivo?", confirmLabel: "Ok", input: { label: "Motivo" } });
    const btn = (await screen.findByText("Ok")) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
