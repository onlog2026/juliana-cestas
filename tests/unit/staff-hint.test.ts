// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { hasSupabaseAuthCookie } from "@/lib/auth/staff-hint";

describe("hasSupabaseAuthCookie", () => {
  it("reconhece o cookie de login do Supabase, inteiro ou picado em partes", () => {
    expect(hasSupabaseAuthCookie("sb-oygizajevizwhiymgsly-auth-token=abc")).toBe(true);
    expect(hasSupabaseAuthCookie("a=1; sb-oygizajevizwhiymgsly-auth-token.0=abc; b=2")).toBe(true);
    expect(hasSupabaseAuthCookie("x=1;sb-abc-auth-token.12=zzz")).toBe(true);
  });

  it("visitante comum (outros cookies, ou nenhum) não conta", () => {
    expect(hasSupabaseAuthCookie("")).toBe(false);
    expect(hasSupabaseAuthCookie("_ga=GA1.1; theme=dark")).toBe(false);
    // parecido, mas não é o cookie de login
    expect(hasSupabaseAuthCookie("sb-abc-refresh=1")).toBe(false);
    expect(hasSupabaseAuthCookie("my-sb-abc-auth-token=1")).toBe(false);
    expect(hasSupabaseAuthCookie("xsb-abc-auth-token=1")).toBe(false);
  });
});

describe("useIsStaff (pergunta ao servidor só quando faz sentido)", () => {
  const checkStaffSession = vi.fn(async () => true);

  beforeEach(() => {
    vi.resetModules(); // o hook guarda a pergunta em variável de módulo
    checkStaffSession.mockReset();
    checkStaffSession.mockResolvedValue(true);
    vi.doMock("@/lib/auth/actions", () => ({ checkStaffSession: () => checkStaffSession() }));
    document.cookie = "sb-abc-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });
  afterEach(() => {
    cleanup();
    vi.doUnmock("@/lib/auth/actions");
  });

  async function mount(count = 1) {
    const { useIsStaff } = await import("@/components/loja/use-is-staff");
    function Probe({ n }: { n: number }) {
      return createElement("span", { "data-testid": `staff-${n}` }, String(useIsStaff()));
    }
    return render(
      createElement("div", null, ...Array.from({ length: count }, (_, i) => createElement(Probe, { key: i, n: i })))
    );
  }

  it("visitante sem cookie de login: ZERO chamadas ao servidor e não é staff", async () => {
    await mount(2);
    await new Promise((r) => setTimeout(r, 30));
    expect(checkStaffSession).not.toHaveBeenCalled();
    expect(screen.getByTestId("staff-0").textContent).toBe("false");
  });

  it("com cookie de login: pergunta UMA vez mesmo com 2 componentes (carrossel + logo) e vira staff", async () => {
    document.cookie = "sb-abc-auth-token=abc; path=/";
    await mount(2);
    await waitFor(() => expect(screen.getByTestId("staff-0").textContent).toBe("true"));
    expect(screen.getByTestId("staff-1").textContent).toBe("true");
    expect(checkStaffSession).toHaveBeenCalledTimes(1);
  });

  it("com cookie, mas o servidor diz que não é da equipe (ex.: cliente logado): nenhum botão de edição", async () => {
    document.cookie = "sb-abc-auth-token=abc; path=/";
    checkStaffSession.mockResolvedValue(false);
    await mount(1);
    await waitFor(() => expect(checkStaffSession).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByTestId("staff-0").textContent).toBe("false");
  });

  it("erro na pergunta ao servidor nunca quebra a página (fica sem botão de edição)", async () => {
    document.cookie = "sb-abc-auth-token=abc; path=/";
    checkStaffSession.mockRejectedValue(new Error("rede caiu"));
    await mount(1);
    await waitFor(() => expect(checkStaffSession).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByTestId("staff-0").textContent).toBe("false");
  });
});
