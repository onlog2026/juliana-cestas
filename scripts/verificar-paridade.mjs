/**
 * Verificação de PARIDADE: cada modelo, na loja REAL (dados reais, nada gravado), tem que entregar tudo
 * que a loja original entrega. Precisa de um servidor de TESTE: build e start com TEMA_TESTE=1
 * (o modelo vem do cabeçalho `x-tema-teste: modelo:variante`; fora do modo de teste isso não existe).
 *
 * Uso: node scripts/verificar-paridade.mjs [base] [modelo]   (base padrão http://localhost:3066)
 *
 * Para cada modelo (1ª variação) em 360 e 1440 px: home → categoria → cesta → adicionar → carrinho.
 * Reprova se faltar recurso (data-recurso), houver rolagem lateral, erro no console, imagem quebrada,
 * link morto, ou se aparecer qualquer texto de loja de demonstração.
 */
import { chromium } from "playwright";
import { TEMAS } from "./modelos-lista.mjs";

const BASE = process.argv[2] || "http://localhost:3066";
const SO = process.argv[3];
const falhas = [];
let telas = 0;

// Recursos que a loja da Juliana TEM com os dados reais de hoje (têm que aparecer em todo modelo).
const HOME_OBRIGATORIA = ["busca", "grade-ordenavel", "beneficios", "faq", "whatsapp", "cartaozinho", "confianca"];
const HOME_OPCIONAL = ["vitrines", "avaliacoes", "banners-promo", "vistos"]; // dependem de dados/uso: só avisam
const CESTA_OBRIGATORIA = ["compra", "entrega"];

const browser = await chromium.launch();
for (const [tema, vars] of Object.entries(TEMAS)) {
  if (SO && SO !== tema) continue;
  const variante = vars[0];
  for (const w of [360, 1440]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w < 500 ? 780 : 900 },
      hasTouch: w < 500,
      extraHTTPHeaders: { "x-tema-teste": `${tema}:${variante}` },
    });
    const page = await ctx.newPage();
    const erros = [];
    page.on("pageerror", (e) => erros.push("js: " + e.message.slice(0, 120)));
    page.on("console", (m) => {
      if (m.type() === "error" && !/favicon|Failed to load resource|gtag|googletagmanager|google-analytics|\/_next\/image/i.test(m.text())) erros.push("console: " + m.text().slice(0, 120));
    });
    const tag = `${tema}@${w}`;

    const checar = async (etapa, obrigatorios = [], opcionais = []) => {
      telas++;
      const r = await page.evaluate(async ({ obrigatorios, opcionais }) => {
        for (const img of document.images) img.loading = "eager";
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((res) => setTimeout(res, 800));
        window.scrollTo(0, 0);
        await new Promise((res) => setTimeout(res, 400));
        const tem = (k) => !!document.querySelector(`[data-recurso="${k}"]`);
        return {
          modelo: document.querySelector("[data-modelo]")?.getAttribute("data-modelo") ?? null,
          lateral: document.documentElement.scrollWidth - innerWidth,
          faltam: obrigatorios.filter((k) => !tem(k)),
          faltamOpc: opcionais.filter((k) => !tem(k)),
          quebradas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(-40)),
          mortos: [...document.querySelectorAll("a")].filter((a) => ["#", ""].includes(a.getAttribute("href") ?? "")).length,
          demo: /Loja de demonstração|desligado na demo|Modo demonstração/i.test(document.body.innerText),
          jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || "").join(" "),
        };
      }, { obrigatorios, opcionais });
      if (r.modelo !== tema) falhas.push(`${tag} ${etapa}: página não está no modelo (data-modelo=${r.modelo})`);
      if (r.lateral > 1) falhas.push(`${tag} ${etapa}: rolagem lateral ${r.lateral}px`);
      if (r.faltam.length) falhas.push(`${tag} ${etapa}: faltam recursos ${r.faltam.join(", ")}`);
      if (r.faltamOpc.length) console.log(`  aviso ${tag} ${etapa}: sem ${r.faltamOpc.join(", ")} (depende de dados/uso)`);
      if (r.quebradas.length) falhas.push(`${tag} ${etapa}: imagem quebrada ${r.quebradas[0]}`);
      if (r.mortos) falhas.push(`${tag} ${etapa}: ${r.mortos} link(s) morto(s)`);
      if (r.demo) falhas.push(`${tag} ${etapa}: apareceu texto de loja de demonstração`);
      return r;
    };

    try {
      await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });
      const home = await checar("início", HOME_OBRIGATORIA, HOME_OPCIONAL);
      if (!/"WebSite"/.test(home.jsonld)) falhas.push(`${tag} início: JSON-LD WebSite ausente`);

      const cat = page.locator('a[href^="/categoria/"]').first();
      if (!(await cat.count())) falhas.push(`${tag}: início sem link de categoria`);
      else {
        await page.goto(`${BASE}${await cat.getAttribute("href")}`, { waitUntil: "networkidle" });
        await checar("categoria");
        const prod = page.locator('a[href^="/produto/"]').first();
        if (!(await prod.count())) falhas.push(`${tag}: categoria sem cesta`);
        else {
          await page.goto(`${BASE}${await prod.getAttribute("href")}`, { waitUntil: "networkidle" });
          const cesta = await checar("cesta", CESTA_OBRIGATORIA, ["avaliacoes", "quem-comprou", "vistos"]);
          if (!/"Product"/.test(cesta.jsonld)) falhas.push(`${tag} cesta: JSON-LD Product ausente`);
          const add = page.locator('[data-recurso="compra"] button').first();
          if (!(await add.count())) falhas.push(`${tag} cesta: botão real de compra não encontrado`);
          else {
            await add.scrollIntoViewIfNeeded();
            await add.click();
            await page.waitForTimeout(500);
          }
          await page.goto(`${BASE}/carrinho`, { waitUntil: "networkidle" });
          const car = await checar("carrinho", ["carrinho"]);
          const temItem = await page.evaluate(() => /Cesta|cesta/.test(document.body.innerText) && !!document.querySelector("input, textarea, select"));
          if (!temItem) falhas.push(`${tag} carrinho: a cesta adicionada não apareceu no carrinho real`);
          void car;
        }
      }
    } catch (e) {
      falhas.push(`${tag}: ${String(e).slice(0, 160)}`);
    }
    for (const e of [...new Set(erros)].slice(0, 3)) falhas.push(`${tag}: ${e}`);
    await ctx.close();
  }
}
await browser.close();
console.log(`${telas} telas verificadas`);
if (falhas.length) {
  console.log(`\nREPROVADO — ${falhas.length} problema(s):`);
  for (const f of falhas.slice(0, 120)) console.log(" -", f);
  process.exit(1);
}
console.log("APROVADO: todos os modelos entregam os recursos da loja.");
