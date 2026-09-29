// Converte para WebP as imagens PNG do Storage (bucket site-media) que estão EM USO
// e troca a referência no banco. NÃO apaga a PNG original (dá para voltar atrás).
//
// Uso:
//   node scripts/convert-storage-png-to-webp.mjs            # ensaio: só mede e mostra o que faria
//   node scripts/convert-storage-png-to-webp.mjs --apply    # sobe os .webp e troca as referências
//
// Regras: favicon (site_settings.favicon_url) continua PNG (exigência do navegador e dos
// ícones do app); SVG não é tocado; PNG sem uso é só listada; largura máxima 1600 px;
// transparência preservada (WebP com alfa).
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import sharp from "sharp";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const BUCKET = "site-media";
const MAX_WIDTH = 1600;
const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Tabelas que podem guardar endereços de imagem. Tabela que não existe é ignorada.
const TABLES = [
  "products",
  "banners",
  "categories",
  "site_settings",
  "site_content",
  "product_addons",
  "brands",
  "media_library",
  "store_profile",
];
// Colunas que NUNCA são trocadas (precisam continuar PNG).
const KEEP_PNG_COLUMNS = new Set(["site_settings.favicon_url"]);

async function listPngs() {
  const found = [];
  async function walk(prefix) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) await walk(path); // pasta
      else if (/\.png$/i.test(item.name)) found.push({ path, size: item.metadata?.size ?? 0 });
    }
  }
  await walk("");
  return found;
}

async function loadRows() {
  const out = {};
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*").limit(5000);
    if (error) continue; // tabela inexistente ou sem permissão: ignora
    out[table] = data ?? [];
  }
  return out;
}

/** Onde cada URL aparece: [{table, id, column}] (ignorando colunas que devem ficar PNG). */
function findUsage(rows, url) {
  const uses = [];
  for (const [table, list] of Object.entries(rows)) {
    for (const row of list) {
      for (const [column, value] of Object.entries(row)) {
        if (KEEP_PNG_COLUMNS.has(`${table}.${column}`)) continue;
        if (value == null) continue;
        const text = typeof value === "string" ? value : JSON.stringify(value);
        if (text.includes(url)) uses.push({ table, id: row.id ?? row.tenant_id ?? null, key: row.id ? "id" : "tenant_id", column, value });
      }
    }
  }
  return uses;
}

function replaceUrl(value, from, to) {
  if (typeof value === "string") return value.split(from).join(to);
  return JSON.parse(JSON.stringify(value).split(from).join(to));
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  console.log(APPLY ? "MODO APLICAR (grava no Storage e no banco)\n" : "ENSAIO (não grava nada)\n");
  const pngs = await listPngs();
  const rows = await loadRows();
  console.log(`PNG no Storage: ${pngs.length} | tabelas lidas: ${Object.keys(rows).join(", ")}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  const unused = [];

  for (const png of pngs) {
    const url = BASE + png.path;
    const uses = findUsage(rows, url);
    if (uses.length === 0) {
      unused.push(png);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`! não consegui baixar ${png.path} (${res.status})`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(original)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 100 })
      .toBuffer();
    totalBefore += original.length;
    totalAfter += webp.length;
    const newPath = png.path.replace(/\.png$/i, ".webp");
    const newUrl = BASE + newPath;
    console.log(
      `${png.path}\n   ${kb(original.length)} -> ${kb(webp.length)} | usado em: ${uses
        .map((u) => `${u.table}.${u.column}`)
        .join(", ")}`
    );

    if (!APPLY) continue;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, webp, { contentType: "image/webp", upsert: false });
    if (upErr && !/exists|Duplicate/i.test(upErr.message)) {
      console.log(`   ! falha ao subir ${newPath}: ${upErr.message} (referência NÃO trocada)`);
      continue;
    }
    for (const u of uses) {
      const next = replaceUrl(u.value, url, newUrl);
      const { error } = await supabase.from(u.table).update({ [u.column]: next }).eq(u.key, u.id);
      console.log(error ? `   ! ${u.table}.${u.column}: ${error.message}` : `   ok ${u.table}.${u.column} trocado`);
    }
  }

  console.log(`\nPNG sem uso (não mexi): ${unused.length} (${kb(unused.reduce((a, p) => a + p.size, 0))})`);
  console.log(`Economia nas PNG em uso: ${kb(totalBefore)} -> ${kb(totalAfter)}  (-${kb(totalBefore - totalAfter)})`);
  if (!APPLY) console.log("\nNada foi gravado. Para aplicar: node scripts/convert-storage-png-to-webp.mjs --apply");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
