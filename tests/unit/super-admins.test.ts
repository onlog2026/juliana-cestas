import { describe, expect, it } from "vitest";
import { SUPER_ADMIN_EMAILS, isSuperAdminEmail } from "@/lib/platform/super-admins";

describe("isSuperAdminEmail", () => {
  it("reconhece os dois e-mails do dono, sem diferenciar maiúsculas/espaços", () => {
    expect(isSuperAdminEmail("adrianorosa2012@gmail.com")).toBe(true);
    expect(isSuperAdminEmail("  ADRIANOROSA1@HOTMAIL.COM ")).toBe(true);
  });

  it("recusa vazio, null e qualquer outro e-mail (inclusive dona de loja)", () => {
    expect(isSuperAdminEmail("")).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
    expect(isSuperAdminEmail("julianadasilvaleite98@gmail.com")).toBe(false);
    expect(isSuperAdminEmail("adrianorosa2012@gmail.com.evil.com")).toBe(false);
  });

  it("a lista tem exatamente 2 e-mails (mudou? atualize também is_super_admin() no SQL)", () => {
    expect(SUPER_ADMIN_EMAILS).toHaveLength(2);
  });
});
