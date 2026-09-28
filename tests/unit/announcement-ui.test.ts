// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// next/link sem roteador montado: troca por <a> simples (só o HTML importa aqui).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown; className?: string }) =>
    createElement("a", { href, ...rest }, children as never),
}));

// A action de salvar é "use server" (banco). Aqui só interessa o que o formulário ENVIA.
const updateContent = vi.fn(async () => ({ ok: true as const }));
vi.mock("@/modules/content/actions", () => ({
  updateContent: (...args: unknown[]) => (updateContent as (...a: unknown[]) => unknown)(...args),
  resetContent: vi.fn(),
}));

import { AnnouncementBar } from "@/components/loja/announcement-bar";
import { ContentAnnouncementForm } from "@/components/admin/content-announcement-form";

afterEach(() => {
  cleanup();
  updateContent.mockClear();
});

describe("AnnouncementBar (o que o cliente vê)", () => {
  const html = (a: Parameters<typeof AnnouncementBar>[0]["announcement"]) =>
    renderToStaticMarkup(createElement(AnnouncementBar, { announcement: a }));

  it("desligada, ou sem texto, não renderiza NADA (nenhuma faixa vazia)", () => {
    expect(html({ enabled: false, text: "Frete grátis" })).toBe("");
    expect(html({ enabled: true, text: "" })).toBe("");
    expect(html({ enabled: true, text: "   " })).toBe("");
  });

  it("ligada com texto: mostra o aviso, com cor da loja por padrão", () => {
    const out = html({ enabled: true, text: "Frete grátis acima de R$ 300" });
    expect(out).toContain("Frete grátis acima de R$ 300");
    expect(out).toContain("bg-primary");
    expect(out).not.toContain("<a ");
  });

  it("link interno vira <a> no mesmo site; https abre em nova aba com noopener", () => {
    const interno = html({ enabled: true, text: "Veja", href: "/categoria/cafe-da-manha" });
    expect(interno).toContain('href="/categoria/cafe-da-manha"');
    expect(interno).not.toContain("_blank");

    const externo = html({ enabled: true, text: "Veja", href: "https://exemplo.com/promo" });
    expect(externo).toContain('href="https://exemplo.com/promo"');
    expect(externo).toContain('target="_blank"');
    expect(externo).toContain("noopener");
  });

  it("cores personalizadas entram no style; sem cor não põe style de cor", () => {
    const com = html({ enabled: true, text: "x", bgColor: "#112233", textColor: "#ffeedd" });
    expect(com).toContain("background-color:#112233");
    expect(com).toContain("color:#ffeedd");
    const sem = html({ enabled: true, text: "x" });
    expect(sem).not.toContain("background-color");
  });

  it("escapa HTML no texto (nome/aviso digitado no painel nunca vira tag)", () => {
    const out = html({ enabled: true, text: '<img src=x onerror=alert(1)> & "aspas"' });
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });
});

describe("ContentAnnouncementForm (o painel)", () => {
  const base = { enabled: false, text: "" };

  it("liga o aviso sem texto: recusa e mostra o motivo, sem chamar o servidor", async () => {
    render(createElement(ContentAnnouncementForm, { value: base }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar aviso/i }));
    fireEvent.click(screen.getByRole("button", { name: /salvar aviso/i }));
    expect(await screen.findByText(/escreva o texto do aviso/i)).toBeTruthy();
    expect(updateContent).not.toHaveBeenCalled();
  });

  it("manda só o que foi preenchido (sem link/cores vazios)", async () => {
    render(createElement(ContentAnnouncementForm, { value: base }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar aviso/i }));
    fireEvent.change(screen.getByPlaceholderText(/frete grátis/i), { target: { value: "  Feriado: fechado dia 7  " } });
    fireEvent.click(screen.getByRole("button", { name: /salvar aviso/i }));

    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(updateContent).toHaveBeenCalledWith("announcement", { enabled: true, text: "Feriado: fechado dia 7" });
  });

  it("inclui link e cor quando preenchidos", async () => {
    render(createElement(ContentAnnouncementForm, { value: base }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar aviso/i }));
    fireEvent.change(screen.getByPlaceholderText(/frete grátis/i), { target: { value: "Promoção" } });
    fireEvent.change(screen.getByPlaceholderText(/categoria\/cafe-da-manha/i), { target: { value: "/categoria/frios" } });
    fireEvent.change(screen.getByLabelText(/cor do fundo do aviso/i), { target: { value: "#aa0000" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar aviso/i }));

    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(updateContent).toHaveBeenCalledWith("announcement", {
      enabled: true,
      text: "Promoção",
      href: "/categoria/frios",
      bgColor: "#aa0000",
    });
  });

  it("a prévia mostra o texto digitado; desligado, avisa que não aparece no site", () => {
    render(createElement(ContentAnnouncementForm, { value: { enabled: false, text: "Olá cliente" } }));
    expect(screen.getByText("Olá cliente", { selector: "span.block" })).toBeTruthy();
    expect(screen.getByText(/esta faixa não aparece no site/i)).toBeTruthy();
  });

  it("mostra o erro do servidor (ex.: link recusado) em vez de fingir que salvou", async () => {
    updateContent.mockResolvedValueOnce({ ok: false, error: "Confira os campos." } as never);
    render(createElement(ContentAnnouncementForm, { value: { enabled: true, text: "Oi" } }));
    fireEvent.click(screen.getByRole("button", { name: /salvar aviso/i }));
    expect(await screen.findByText("Confira os campos.")).toBeTruthy();
    expect(screen.queryByText("Salvo")).toBeNull();
  });
});
