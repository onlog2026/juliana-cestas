// Prova de isolamento entre lojas, direto na API REST do Supabase -- nunca
// pela tela (a tela esconde; a API é o que um atacante usa).
//
//   node tests/isolation/tenant-isolation.mjs
//
// Lê .env.local. Sai com código 1 se qualquer checagem falhar.
//
// Parte A  anon (chave pública) não pode ler NENHUMA linha das tabelas do
//          catálogo/config sem estar dentro do servidor. Enquanto as 8
//          policies públicas antigas existirem (até a migration 0020), esta
//          parte FALHA DE PROPÓSITO -- é a prova de que o furo existe.
// Parte B  (opcional) um staff da loja B, logado, não lê linhas da loja A.
//          Precisa de ISOLATION_STAFF_B_EMAIL / ISOLATION_STAFF_B_PASSWORD e
//          ISOLATION_TENANT_A_ID no ambiente.
// Parte C  sanidade: a service role enxerga os tenants (garante que o .env
//          está certo e que um "0 linhas" não é só chave errada).

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(2);
}

const PUBLIC_TABLES = [
  "products",
  "product_addons",
  "banners",
  "categories",
  "delivery_settings",
  "delivery_zones",
  "site_settings",
  "store_profile",
];

let failures = 0;
const ok = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
};

async function rest(path, token, init = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

console.log("\nParte A -- anon não lê nada do catálogo/config");
for (const table of PUBLIC_TABLES) {
  const { status, body } = await rest(`${table}?select=*&limit=5`, ANON);
  const rows = Array.isArray(body) ? body.length : 0;
  if (status === 200 && rows === 0) ok(`${table}: 0 linhas`);
  else if (status !== 200) ok(`${table}: recusado (${status})`);
  else fail(`${table}: anon leu ${rows} linha(s) -- policy pública sem tenant ainda ativa`);
}

console.log("\nParte B -- staff da loja B não lê a loja A");
const emailB = process.env.ISOLATION_STAFF_B_EMAIL;
const passB = process.env.ISOLATION_STAFF_B_PASSWORD;
const tenantA = process.env.ISOLATION_TENANT_A_ID;
if (!emailB || !passB || !tenantA) {
  console.log("  SKIP  defina ISOLATION_STAFF_B_EMAIL, ISOLATION_STAFF_B_PASSWORD e ISOLATION_TENANT_A_ID");
} else {
  const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailB, password: passB }),
  }).then((r) => r.json());
  if (!login.access_token) {
    fail(`login do staff B falhou: ${JSON.stringify(login).slice(0, 200)}`);
  } else {
    for (const table of ["products", "banners", "orders", "customers", "support_tickets"]) {
      const { status, body } = await rest(`${table}?select=id&tenant_id=eq.${tenantA}&limit=5`, login.access_token);
      const rows = Array.isArray(body) ? body.length : 0;
      if (rows === 0) ok(`${table}: staff B vê 0 linhas da loja A (${status})`);
      else fail(`${table}: staff B leu ${rows} linha(s) da loja A`);
    }
  }
}

console.log("\nParte C -- sanidade da service role");
{
  const { status, body } = await rest("tenants?select=id,slug", SERVICE);
  if (status === 200 && Array.isArray(body) && body.length >= 1) ok(`service role enxerga ${body.length} tenant(s): ${body.map((t) => t.slug).join(", ")}`);
  else fail(`service role não conseguiu ler tenants (${status})`);
}

console.log(failures === 0 ? "\nISOLAMENTO OK" : `\nISOLAMENTO COM ${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
