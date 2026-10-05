/**
 * Gera as capturas da vitrine de modelos (computador 1440px e celular 390px)
 * a partir das lojas demo `/modelos/ver/<modelo>?variante=<v>`.
 *
 * Uso: com o site rodando (build de produção), `node scripts/capturar-modelos.mjs [base]`
 * base padrão: http://localhost:3066. Salva em public/modelos/<modelo>-<variante>-{d,m}.webp
 */
import { chromium, devices } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3066";
import { TEMAS } from "./modelos-lista.mjs";

mkdirSync("public/modelos", { recursive: true });
const browser = await chromium.launch();
for (const [modo, opts] of [
  ["d", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }],
  ["m", { ...devices["iPhone 13"] }],
]) {
  const ctx = await browser.newContext(opts);
  for (const [tema, vars] of Object.entries(TEMAS)) {
    for (const v of vars) {
      const page = await ctx.newPage();
      await page.goto(`${BASE}/modelos/ver/${tema}?variante=${v}`, { waitUntil: "networkidle", timeout: 120000 });
      await page.evaluate(async () => {
        for (const img of document.images) img.loading = "eager";
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 900));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      const png = await page.screenshot({ fullPage: false });
      const largura = modo === "d" ? 1400 : 520;
      await sharp(png).resize({ width: largura }).webp({ quality: 78 }).toFile(`public/modelos/${tema}-${v}-${modo}.webp`);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      console.log(tema, v, modo, sw > 0 ? `ROLAGEM LATERAL ${sw}px` : "ok");
      await page.close();
    }
  }
  await ctx.close();
}
await browser.close();
