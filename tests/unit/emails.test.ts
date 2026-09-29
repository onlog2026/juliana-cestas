import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { orderPaidEmail } from "@/modules/notifications/templates/order-paid";
import { orderPlacedEmail } from "@/modules/notifications/templates/order-placed";
import { deliveredEmail } from "@/modules/notifications/templates/delivered";
import { reviewInviteEmail } from "@/modules/notifications/templates/review-invite";
import { emailShell, escapeHtml, formatBrl, htmlToText } from "@/modules/notifications/templates/shell";

const brand = { storeName: "Juliana Cestas", logoUrl: "https://cdn.exemplo.com/logo.webp", siteUrl: "https://julianacesta.com.br", replyTo: null };

describe("shell", () => {
  it("escapa HTML e formata reais", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'a'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;a&#39;");
    expect(formatBrl(289990)).toBe("R$ 2.899,90");
    expect(formatBrl(500)).toBe("R$ 5,00");
    expect(formatBrl(0)).toBe("R$ 0,00");
  });

  it("faixa colorida com logo, cor validada e imagem de contexto com texto alternativo", () => {
    const html = emailShell("<p>oi</p>", brand, { bandColor: "#123456", heroImageUrl: "https://cdn.exemplo.com/h.png", heroAlt: "Cesta linda" });
    expect(html).toContain('bgcolor="#123456"');
    expect(html).toContain('src="https://cdn.exemplo.com/logo.webp"');
    expect(html).toContain('alt="Cesta linda"');
    // cor inválida cai no padrão; endereço que não é http(s) nunca vira src/href
    const ruim = emailShell("<p>oi</p>", { ...brand, logoUrl: "javascript:alert(1)" }, { bandColor: "red;background:url(x)", heroImageUrl: "javascript:1" });
    expect(ruim).not.toContain("javascript:");
    expect(ruim).not.toContain("url(x)");
    expect(ruim).toContain("Juliana Cestas"); // sem logo válida, mostra o nome
  });

  it("texto puro mantém os links", () => {
    const text = htmlToText('<p>Oi!</p><p><a href="https://x.com/p?t=1">Acompanhar</a></p>');
    expect(text).toContain("Oi!");
    expect(text).toContain("Acompanhar: https://x.com/p?t=1");
  });
});

describe("e-mails do pedido", () => {
  const linha = { orderNumber: 1010, recipientName: "Vovó <b>Ana</b>", deliveryDateLabel: "sábado, 04/10", slotLabel: "09:00 e 10:00", totalCents: 28990 };

  it("pedido efetuado: escapa nomes, tem texto puro com o link e assunto sem traço solto", () => {
    const r = orderPlacedEmail({ buyerName: "Maria Silva", orders: [linha], totalCents: 28990, orderUrl: "https://julianacesta.com.br/pedido/abc?t=xyz" }, brand);
    expect(r.subject).toBe("Recebemos o seu pedido #1010 — Juliana Cestas");
    expect(r.html).toContain("Vovó &lt;b&gt;Ana&lt;/b&gt;");
    expect(r.html).not.toContain("<b>Ana</b>");
    expect(r.html).toContain("Oi, Maria!");
    expect(r.text).toContain("https://julianacesta.com.br/pedido/abc?t=xyz");
    const semMarca = orderPlacedEmail({ buyerName: "Maria", orders: [linha], totalCents: 1, orderUrl: "https://a.com" }, { ...brand, storeName: "" });
    expect(semMarca.subject.endsWith("— ")).toBe(false);
    expect(semMarca.subject).toBe("Recebemos o seu pedido #1010");
  });

  it("carrinho: UM e-mail com uma linha por cesta e o total", () => {
    const r = orderPlacedEmail(
      { buyerName: "Maria", orders: [linha, { ...linha, orderNumber: 1011, totalCents: 15000 }], totalCents: 43990, orderUrl: "https://a.com/p" },
      brand
    );
    expect(r.subject).toContain("2 presentes");
    expect(r.html).toContain("#1010");
    expect(r.html).toContain("#1011");
    expect(r.html).toContain("R$ 439,90");
  });

  it("pagamento confirmado (um pedido e vários) e sem botão quando não há endereço", () => {
    const um = orderPaidEmail({ buyerName: "Maria", orders: [{ orderNumber: 7, recipientName: "Ana", totalCents: 5000 }] }, brand);
    expect(um.subject).toBe("Pagamento confirmado: pedido #7 — Juliana Cestas");
    expect(um.html).not.toContain("border-radius:999px");
    const varios = orderPaidEmail(
      { buyerName: "Maria", orders: [{ orderNumber: 7, totalCents: 5000 }, { orderNumber: 8, totalCents: 7000 }], ctaUrl: "https://julianacesta.com.br" },
      brand
    );
    expect(varios.html).toContain("R$ 120,00");
    expect(varios.html).toContain("https://julianacesta.com.br");
  });

  it("agradecimento e pesquisa saem com texto puro e escapam o nome", () => {
    const d = deliveredEmail({ orderNumber: 9, buyerName: "<i>Zé</i> Souza" }, brand);
    expect(d.html).not.toContain("<i>Zé</i>");
    expect(d.text.length).toBeGreaterThan(20);
    const r = reviewInviteEmail({ orderNumber: 9, buyerName: "Zé", itemNames: ["Cesta <x>"], reviewUrl: "https://a.com/avaliar/tok" }, brand);
    expect(r.html).toContain("Cesta &lt;x&gt;");
    expect(r.text).toContain("https://a.com/avaliar/tok?nota=5");
  });
});

describe("webhook do Asaas não pode importar nada de '@/'", () => {
  it("os arquivos puros de e-mail e o webhook só importam por caminho relativo/node", () => {
    const files = [
      "src/modules/notifications/templates/shell.ts",
      "src/modules/notifications/templates/order-paid.ts",
      "src/app/api/asaas/webhook/[tenantId]/route.ts",
    ];
    for (const f of files) {
      const source = readFileSync(f, "utf8");
      const imports = [...source.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
      for (const spec of imports) {
        expect(spec.startsWith("@/"), `${f} importa ${spec}`).toBe(false);
        expect(spec.includes("server-only"), `${f} importa ${spec}`).toBe(false);
      }
    }
    // shell.ts não importa nada; order-paid só importa ./shell
    expect([...readFileSync(files[0], "utf8").matchAll(/^\s*import\s/gm)]).toHaveLength(0);
    const paid = [...readFileSync(files[1], "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(paid).toEqual(["./shell"]);
  });
});
