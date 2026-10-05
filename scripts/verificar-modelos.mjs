/**
 * Verificação automática dos modelos de loja (rodar ANTES de publicar).
 * Para cada modelo × variação × largura (360, 768, 1440) NAVEGA de verdade na loja demo:
 * início → categoria → cesta → adicionar ao carrinho → carrinho. Reprova se houver:
 * rolagem lateral, erro no console, imagem quebrada, link morto (# ou 404), botão
 * "adicionar" inalcançável, ou alvo de toque < 44px nos botões principais.
 *
 * Uso: node scripts/verificar-modelos.mjs [base] [modelo]   (base padrão http://localhost:3066)
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3066";
const SO_MODELO = process.argv[3];
import { TEMAS } from "./modelos-lista.mjs";
const LARGURAS = [360, 768, 1440];
const falhas = [];
let telas = 0;

const browser = await chromium.launch();
for (const [tema, vars] of Object.entries(TEMAS)) {
  if (SO_MODELO && SO_MODELO !== tema) continue;
  for (const v of vars) {
    for (const w of LARGURAS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 780 : 900 }, hasTouch: w < 500 });
      const page = await ctx.newPage();
      const erros = [];
      page.on("pageerror", (e) => erros.push("js: " + e.message.slice(0, 120)));
      page.on("console", (m) => {
        if (m.type() === "error" && !/favicon|Failed to load resource.*(font|gtag|googletagmanager|google-analytics)/i.test(m.text())) erros.push("console: " + m.text().slice(0, 120));
      });
      const tag = `${tema}/${v}@${w}`;
      const checar = async (etapa) => {
        telas++;
        const r = await page.evaluate(async () => {
          for (const img of document.images) img.loading = "eager";
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((res) => setTimeout(res, 700));
          window.scrollTo(0, 0);
          await new Promise((res) => setTimeout(res, 500));
          const lateral = document.documentElement.scrollWidth - innerWidth;
          const quebradas = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(-40));
          const mortos = [...document.querySelectorAll("a")].filter((a) => ["#", ""].includes(a.getAttribute("href") ?? "")).length;
          const pequenos = [...document.querySelectorAll("button, a[href]")]
            .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 36 && !!e.textContent?.trim() && getComputedStyle(e).display !== "inline"; })
            .map((e) => (e.textContent || "").trim().slice(0, 20));
          return { lateral, quebradas, mortos, pequenos: pequenos.slice(0, 3) };
        });
        if (r.lateral > 1) falhas.push(`${tag} ${etapa}: rolagem lateral ${r.lateral}px`);
        if (r.quebradas.length) falhas.push(`${tag} ${etapa}: imagem quebrada ${r.quebradas[0]}`);
        if (r.mortos) falhas.push(`${tag} ${etapa}: ${r.mortos} link(s) morto(s) (#)`);
        if (r.pequenos.length) falhas.push(`${tag} ${etapa}: alvo de toque pequeno: ${r.pequenos.join(" | ")}`);
      };
      try {
        await page.goto(`${BASE}/demo/${tema}/${v}`, { waitUntil: "networkidle", timeout: 90000 });
        await checar("início");
        const cat = page.locator(`a[href^="/demo/${tema}/${v}/categoria/"]`).first();
        if (!(await cat.count())) falhas.push(`${tag}: início sem link de categoria`);
        else {
          await page.goto(`${BASE}${await cat.getAttribute("href")}`, { waitUntil: "networkidle" });
          await checar("categoria");
          const prod = page.locator(`a[href^="/demo/${tema}/${v}/produto/"]`).first();
          if (!(await prod.count())) falhas.push(`${tag}: categoria sem cesta`);
          else {
            await page.goto(`${BASE}${await prod.getAttribute("href")}`, { waitUntil: "networkidle" });
            await checar("cesta");
            const add = page.locator("[data-acao=comprar]").or(page.getByRole("button", { name: /^Adicionar/ })).first();
            await add.scrollIntoViewIfNeeded();
            await add.click();
            await page.goto(`${BASE}/demo/${tema}/${v}/carrinho`, { waitUntil: "networkidle" });
            await checar("carrinho");
            if (!(await page.getByText("Total").count())) falhas.push(`${tag}: carrinho não mostrou o item adicionado`);
          }
        }
      } catch (e) {
        falhas.push(`${tag}: ${String(e).slice(0, 140)}`);
      }
      for (const e of [...new Set(erros)].slice(0, 3)) falhas.push(`${tag}: ${e}`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`${telas} telas verificadas`);
if (falhas.length) {
  console.log(`\nREPROVADO — ${falhas.length} problema(s):`);
  for (const f of falhas.slice(0, 80)) console.log(" -", f);
  process.exit(1);
}
console.log("APROVADO: nenhum problema encontrado.");
