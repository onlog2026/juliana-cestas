// Prova de "Instalar modelo" / "Voltar ao anterior" contra uma loja DESCARTÁVEL.
//
//   node tests/isolation/instalar-voltar.mjs
//
// Cria uma loja de teste (slug zz-teste-instalar-<hora>), roda os cenários com as MESMAS
// funções que as actions usam e apaga só o que criou. NUNCA toca na loja da Juliana
// (o script recusa o id dela e confere que a linha de tema dela não mudou).
// Lê .env.local. Sai com código 1 se qualquer checagem falhar.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { instalarNoBanco, voltarNoBanco } from "../../src/modules/storefront/temas-instalacao.ts";

config({ path: ".env.local", quiet: true });

const JULIANA = "a0000000-0000-4000-8000-000000000001";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(2);
}
const db = createClient(URL, SERVICE, { auth: { persistSession: false } });

let falhas = 0;
const confere = (nome, cond, detalhe = "") => {
  console.log(`${cond ? "OK   " : "FALHA"} ${nome}${cond ? "" : " -> " + detalhe}`);
  if (!cond) falhas++;
};
const linha = async (id) => (await db.from("store_theme").select("template_key, tokens, fonts, layout").eq("tenant_id", id).maybeSingle()).data;

// Estado da Juliana ANTES (só leitura).
const julianaAntes = JSON.stringify(await linha(JULIANA));

const slug = `zz-teste-instalar-${Date.now()}`;
const { data: criada, error: erroCriar } = await db.from("tenants").insert({ slug, name: "ZZ Loja de teste (apagar)" }).select("id").single();
if (erroCriar || !criada) {
  console.error("Não consegui criar a loja de teste:", erroCriar?.message);
  process.exit(2);
}
const T = criada.id;
if (T === JULIANA) process.exit(2);
console.log(`Loja de teste criada: ${slug}`);

try {
  // 1) Loja sem tema -> instala -> volta (linha some)
  confere("1. loja nova começa sem tema", (await linha(T)) === null);
  let r = await instalarNoBanco(db, T, "noir", "vinhos", null);
  let l = await linha(T);
  confere("1. instalar Noir/vinhos grava motor=temas e variante", r.ok && l?.template_key === "noir" && l?.layout?.motor === "temas" && l?.layout?.variante === "vinhos", JSON.stringify(l));
  confere("1. sem tema antes, 'anterior' é null", l?.layout?.anterior === null, JSON.stringify(l?.layout));
  r = await voltarNoBanco(db, T, null);
  confere("1. voltar apaga a linha (loja volta ao visual de sempre)", r.ok && (await linha(T)) === null);

  // 2) Loja com tema do sistema antigo -> instala -> volta restaura IGUAL
  const antigo = { tenant_id: T, template_key: "editorial", tokens: { primary: "#123456" }, fonts: { title: "x" }, layout: { header: "centered" } };
  const ins = await db.from("store_theme").insert(antigo);
  confere("2. preparou tema antigo", !ins.error, ins.error?.message);
  r = await instalarNoBanco(db, T, "festa", "aniversario", null);
  l = await linha(T);
  confere("2. instalar guarda o tema antigo em 'anterior'", r.ok && l?.layout?.anterior?.template_key === "editorial" && l?.layout?.anterior?.tokens?.primary === "#123456", JSON.stringify(l?.layout));
  // 3) Reinstalar por cima mantém o anterior ORIGINAL
  r = await instalarNoBanco(db, T, "rustico", "colonial", null);
  l = await linha(T);
  confere("3. reinstalar outro modelo mantém o 'anterior' original", r.ok && l?.template_key === "rustico" && l?.layout?.anterior?.template_key === "editorial", JSON.stringify(l?.layout));
  r = await voltarNoBanco(db, T, null);
  l = await linha(T);
  confere("2/3. voltar restaura o tema antigo exatamente", r.ok && l?.template_key === "editorial" && l?.tokens?.primary === "#123456" && l?.fonts?.title === "x" && l?.layout?.header === "centered", JSON.stringify(l));

  // 4) Voltar sem modelo novo instalado recusa e não altera nada
  const antes = JSON.stringify(await linha(T));
  r = await voltarNoBanco(db, T, null);
  confere("4. voltar sem modelo novo é recusado", r.ok === false);
  confere("4. e não altera a linha", JSON.stringify(await linha(T)) === antes);
} finally {
  // Limpeza: só a loja de teste que este script criou (id exato).
  await db.from("store_theme").delete().eq("tenant_id", T);
  const del = await db.from("tenants").delete().eq("id", T);
  confere("limpeza: loja de teste apagada", !del.error, del.error?.message);
}

// 5) A Juliana não mudou
confere("5. tema da Juliana idêntico ao de antes (não foi tocada)", JSON.stringify(await linha(JULIANA)) === julianaAntes);

console.log(falhas === 0 ? "\nTUDO CERTO: instalar e voltar funcionam." : `\n${falhas} FALHA(S).`);
process.exit(falhas === 0 ? 0 : 1);
