// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
const submit = vi.fn();
vi.mock("@/modules/reviews/experience-actions", () => ({ submitDeliveryExperience: (d: FormData) => submit(d) }));

import { DeliveryExperienceForm } from "@/components/loja/reviews/delivery-experience-form";

beforeEach(() => {
  submit.mockReset();
  submit.mockResolvedValue({ ok: true });
  refresh.mockReset();
  // jsdom não tem createObjectURL
  URL.createObjectURL = vi.fn(() => "blob:foto");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => cleanup());

const props = { orderId: "o1", storeName: "Juliana Cestas", whatsapp: "61999894889", alreadySent: null };

function pickFile(size = 1000) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([new Uint8Array(size)], "foto.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [file] } });
  return input;
}

describe("DeliveryExperienceForm", () => {
  it("abre a câmera do celular (capture) e só aceita imagem", () => {
    render(createElement(DeliveryExperienceForm, props));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute("capture")).toBe("environment");
    expect(input.getAttribute("accept")).toBe("image/*");
  });

  it("Enviar só libera com foto E autorização", () => {
    render(createElement(DeliveryExperienceForm, props));
    const send = screen.getByText("Enviar minha foto") as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    pickFile();
    expect(send.disabled).toBe(true); // falta a autorização
    fireEvent.click(screen.getByRole("checkbox"));
    expect(send.disabled).toBe(false);
  });

  it("foto grande demais é recusada antes de enviar", () => {
    render(createElement(DeliveryExperienceForm, props));
    pickFile(4 * 1024 * 1024);
    expect(screen.getByRole("alert").textContent).toContain("grande demais");
  });

  it("envia foto, texto e autorização; depois mostra o agradecimento", async () => {
    render(createElement(DeliveryExperienceForm, props));
    pickFile();
    fireEvent.change(screen.getByPlaceholderText(/Chegou lindo/), { target: { value: "Amou!" } });
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => {
      fireEvent.click(screen.getByText("Enviar minha foto"));
    });
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const data = submit.mock.calls[0][0] as FormData;
    expect(data.get("orderId")).toBe("o1");
    expect(data.get("text")).toBe("Amou!");
    expect(data.get("consent")).toBe("on");
    expect((data.get("photo") as File).name).toBe("foto.jpg");
    await waitFor(() => expect(screen.getByText(/Obrigado por compartilhar/)).toBeTruthy());
  });

  it("erro do servidor aparece e o formulário continua", async () => {
    submit.mockResolvedValue({ ok: false, error: "Falhou de propósito" });
    render(createElement(DeliveryExperienceForm, props));
    pickFile();
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => {
      fireEvent.click(screen.getByText("Enviar minha foto"));
    });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Falhou de propósito"));
  });

  it("pedido que já enviou mostra o estado e permite trocar; link de remoção usa o WhatsApp da loja", () => {
    render(createElement(DeliveryExperienceForm, { ...props, alreadySent: { photoUrl: "https://x/f.webp", status: "pendente" } }));
    expect(screen.getByText(/depois que Juliana Cestas conferir/)).toBeTruthy();
    const link = screen.getByText("Quero remover minha foto") as HTMLAnchorElement;
    expect(link.href).toContain("wa.me/5561999894889");
  });
});
