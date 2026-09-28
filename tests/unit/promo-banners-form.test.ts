// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }),
}));

const updateContent = vi.fn(async () => ({ ok: true as const }));
vi.mock("@/modules/content/actions", () => ({
  updateContent: (...args: unknown[]) => (updateContent as (...a: unknown[]) => unknown)(...args),
  resetContent: vi.fn(),
}));

const NEW_URL = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/x/novo.webp";
const uploadMedia = vi.fn(async () => ({ ok: true as const, url: NEW_URL }));
vi.mock("@/modules/media/actions", () => ({
  uploadMedia: (...args: unknown[]) => (uploadMedia as (...a: unknown[]) => unknown)(...args),
}));

import { ContentPromoBannersForm } from "@/components/admin/content-promo-banners-form";

const empty = { imageUrl: "", href: "", alt: "" };
const OFF = { enabled: false, wide: empty, narrow: empty };

afterEach(() => {
  cleanup();
  updateContent.mockClear();
  uploadMedia.mockClear();
});

// Ordem dos <input type="file">: larga(desktop), larga(celular), estreita(desktop), estreita(celular)
const fileInputs = (c: HTMLElement) => [...c.querySelectorAll('input[type="file"]')] as HTMLInputElement[];
const upload = (input: HTMLInputElement) =>
  fireEvent.change(input, { target: { files: [new File(["x"], "foto.png", { type: "image/png" })] } });

describe("ContentPromoBannersForm (o painel)", () => {
  it("ligar sem nenhuma imagem: recusa e explica, sem chamar o servidor", async () => {
    render(createElement(ContentPromoBannersForm, { value: OFF }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar os banners/i }));
    fireEvent.click(screen.getByRole("button", { name: /salvar banners/i }));
    expect(await screen.findByText(/envie pelo menos uma imagem/i)).toBeTruthy();
    expect(updateContent).not.toHaveBeenCalled();
  });

  it("desligado, salva mesmo sem imagens (é assim que se apaga tudo)", async () => {
    render(createElement(ContentPromoBannersForm, { value: OFF }));
    fireEvent.click(screen.getByRole("button", { name: /salvar banners/i }));
    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(updateContent).toHaveBeenCalledWith("promo_banners", {
      enabled: false,
      wide: { imageUrl: "", href: "", alt: "" },
      narrow: { imageUrl: "", href: "", alt: "" },
    });
  });

  it("envia a imagem larga pelo painel e salva só o que foi preenchido", async () => {
    const { container } = render(createElement(ContentPromoBannersForm, { value: OFF }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar os banners/i }));

    upload(fileInputs(container)[0]);
    await waitFor(() => expect(uploadMedia).toHaveBeenCalledTimes(1));
    // a miniatura da imagem enviada aparece
    await waitFor(() => expect(container.querySelector(`img[src="${NEW_URL}"]`)).toBeTruthy());

    const links = screen.getAllByPlaceholderText(/categoria\/frios/i);
    fireEvent.change(links[0], { target: { value: "  /categoria/frios  " } });
    const alts = screen.getAllByPlaceholderText(/natal com 10%/i);
    fireEvent.change(alts[0], { target: { value: "  Cestas de Natal  " } });

    fireEvent.click(screen.getByRole("button", { name: /salvar banners/i }));
    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(updateContent).toHaveBeenCalledWith("promo_banners", {
      enabled: true,
      // sem mobileImageUrl quando não há imagem só do celular; link e alt aparados
      wide: { imageUrl: NEW_URL, href: "/categoria/frios", alt: "Cestas de Natal" },
      narrow: { imageUrl: "", href: "", alt: "" },
    });
  });

  it("imagem só do celular vai como mobileImageUrl", async () => {
    const { container } = render(createElement(ContentPromoBannersForm, { value: OFF }));
    fireEvent.click(screen.getByRole("switch", { name: /mostrar os banners/i }));
    upload(fileInputs(container)[2]); // estreita, desktop
    await waitFor(() => expect(uploadMedia).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector(`img[src="${NEW_URL}"]`)).toBeTruthy());
    upload(fileInputs(container)[3]); // estreita, celular
    await waitFor(() => expect(uploadMedia).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: /salvar banners/i }));
    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    const payload = (updateContent.mock.calls as unknown as [string, { narrow: Record<string, string> }][])[0][1];
    expect(payload.narrow.imageUrl).toBe(NEW_URL);
    expect(payload.narrow.mobileImageUrl).toBe(NEW_URL);
  });

  it("mostra o erro do servidor em vez de fingir que salvou", async () => {
    updateContent.mockResolvedValueOnce({ ok: false, error: "Confira os campos." } as never);
    render(createElement(ContentPromoBannersForm, { value: { ...OFF, enabled: false } }));
    fireEvent.click(screen.getByRole("button", { name: /salvar banners/i }));
    expect(await screen.findByText("Confira os campos.")).toBeTruthy();
    expect(screen.queryByText("Salvo")).toBeNull();
  });
});
