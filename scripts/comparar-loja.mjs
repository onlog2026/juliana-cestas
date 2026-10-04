/**
 * Compara a loja local com a de produção (captura lado a lado, diferença em pixels).
 * Uso: node scripts/comparar-loja.mjs [local] [producao]
 * Serve para provar que uma mudança NÃO alterou a loja que está no ar (a Juliana).
 */
import { chromium, devices } from "playwright";
import sharp from "sharp";

const LOCAL = process.argv[2] || "http://localhost:3066";
const PROD = process.argv[3] || "https://www.julianacestas.com.br";
const PAGINAS = ["/", "/categoria/cafe-da-manha", "/produto/nova-cesta-muipr2pw", "/carrinho"];

async function tirar(browser, base, caminho, opts) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + caminho, { waitUntil: "networkidle", timeout: 90000 });
  await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
  await page.evaluate(async () => {
    for (const i of document.images) i.loading = "eager";
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 900));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  const png = await page.screenshot({ fullPage: true });
  await ctx.close();
  return png;
}

const browser = await chromium.launch();
let pior = 0;
for (const [nome, opts] of [["computador", { viewport: { width: 1440, height: 900 } }], ["celular", { ...devices["iPhone 13"] }]]) {
  for (const p of PAGINAS) {
    const [a, b] = await Promise.all([tirar(browser, LOCAL, p, opts), tirar(browser, PROD, p, opts)]);
    const ma = await sharp(a).metadata();
    const mb = await sharp(b).metadata();
    const w = Math.min(ma.width, mb.width);
    const h = Math.min(ma.height, mb.height);
    const ra = await sharp(a).extract({ left: 0, top: 0, width: w, height: h }).raw().toBuffer();
    const rb = await sharp(b).extract({ left: 0, top: 0, width: w, height: h }).raw().toBuffer();
    const ch = ma.channels;
    let dif = 0;
    for (let i = 0; i < ra.length; i += ch) {
      if (Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2]) > 40) dif++;
    }
    const pct = (dif / (w * h)) * 100;
    pior = Math.max(pior, pct);
    console.log(`${nome} ${p}: altura ${ma.height} x ${mb.height}, pixels diferentes ${pct.toFixed(2)}%`);
  }
}
await browser.close();
console.log(pior < 1 ? "IGUAL: a loja não mudou." : `ATENÇÃO: diferença de até ${pior.toFixed(2)}%`);
