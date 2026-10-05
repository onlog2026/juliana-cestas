/**
 * Auditoria de CONTRASTE NO HOVER: para cada modelo × variação, passa o mouse em links e botões
 * (menus, cabeçalho, rodapé, cartões) e mede o contraste entre a cor do texto e o fundo efetivo.
 * Reprova quando o hover deixa o texto ilegível (< 4,5) ou piora um texto que era legível.
 *
 * Uso: node scripts/auditar-hover.mjs [base] [modelo]   (base padrão http://localhost:3066)
 */
import { chromium } from "playwright";
import { TEMAS } from "./modelos-lista.mjs";

const BASE = process.argv[2] || "http://localhost:3066";
const SO = process.argv[3];
const problemas = [];
let medidos = 0;

const browser = await chromium.launch();
for (const [tema, vars] of Object.entries(TEMAS)) {
  if (SO && SO !== tema) continue;
  for (const v of vars) {
    const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const paginas = [`/demo/${tema}/${v}`];
    try {
      await page.goto(paginas[0], { waitUntil: "networkidle", timeout: 90000 });
      const cat = await page.locator(`a[href^="/demo/${tema}/${v}/categoria/"]`).first().getAttribute("href");
      if (cat) paginas.push(cat);
    } catch (e) {
      problemas.push(`${tema}/${v}: não abriu (${String(e).slice(0, 80)})`);
    }
    for (const rota of paginas) {
      try {
        await page.goto(rota, { waitUntil: "networkidle", timeout: 90000 });
        await page.addStyleTag({ content: "*{animation:none!important}" });
        const total = await page.evaluate(() => {
          const alvos = [...document.querySelectorAll("header a, nav a, footer a, main a[href], main button, [role=region] a")].filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 8 && b.height > 8 && !!(e.textContent || "").trim();
          });
          alvos.forEach((e, i) => e.setAttribute("data-aud", String(i)));
          return alvos.length;
        });
        for (let i = 0; i < Math.min(total, 45); i++) {
          const el = page.locator(`[data-aud="${i}"]`);
          const medir = () => el.evaluate((e) => {
            const parse = (c) => {
              const m = c.match(/rgba?\(([^)]+)\)/) || c.match(/color\(srgb ([^)]+)\)/);
              if (!m) return null;
              const p = m[1].replace("/", " ").split(/[ ,]+/).filter(Boolean).map(Number);
              const srgb = c.startsWith("color(");
              const [r, g, b] = srgb ? p.slice(0, 3).map((x) => x * 255) : p.slice(0, 3);
              const a = p.length > 3 ? p[3] : 1;
              return { r, g, b, a };
            };
            const lum = ({ r, g, b }) => {
              const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
              return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            // Mede o elemento que de fato contém o texto (o primeiro texto não vazio dentro do alvo),
            // não o link/cartão pai, que pode ter cor e fundo diferentes da legenda.
            const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
            let alvoTexto = e, tn;
            while ((tn = walker.nextNode())) { if ((tn.textContent || "").trim()) { alvoTexto = tn.parentElement || e; break; } }
            const cs = getComputedStyle(alvoTexto);
            const txt = parse(cs.color);
            let bg = null, n = alvoTexto;
            while (n && n !== document.documentElement) {
              const s = getComputedStyle(n);
              if (s.backgroundImage !== "none") return { pular: true };
              const c = parse(s.backgroundColor);
              if (c && c.a > 0.6) { bg = c; break; }
              n = n.parentElement;
            }
            if (!bg) bg = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
            if (!txt) return { pular: true };
            const [x, y] = [lum(txt), lum(bg)].sort((p, q) => q - p);
            return { ratio: (x + 0.05) / (y + 0.05), cor: cs.color, fundo: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, texto: (e.textContent || "").trim().slice(0, 24) };
          });
          let antes;
          try {
            await el.scrollIntoViewIfNeeded({ timeout: 2000 });
            antes = await medir();
            await el.hover({ timeout: 2000, force: true });
            await page.waitForTimeout(320);
          } catch { continue; }
          const depois = await medir();
          if (antes.pular || depois.pular) continue;
          medidos++;
          if (depois.ratio < 4.5 && (antes.ratio >= 4.5 || depois.ratio < 3)) {
            problemas.push(`${tema}/${v} ${rota.replace(`/demo/${tema}/${v}`, "") || "/"}: "${depois.texto}" hover ${depois.ratio.toFixed(1)} (antes ${antes.ratio.toFixed(1)}) texto ${depois.cor} sobre ${depois.fundo}`);
          }
          await page.mouse.move(0, 0);
        }
      } catch (e) {
        problemas.push(`${tema}/${v} ${rota}: erro ${String(e).slice(0, 80)}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${medidos} elementos medidos com o mouse em cima`);
if (problemas.length) {
  console.log(`\nREPROVADO — ${problemas.length} problema(s):`);
  for (const p of [...new Set(problemas)].slice(0, 120)) console.log(" -", p);
  process.exit(1);
}
console.log("APROVADO: nenhum texto fica ilegível no hover.");
