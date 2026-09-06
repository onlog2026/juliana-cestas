// Backup do banco antes de cada migração -- o Supabase Free não tem
// point-in-time recovery, então este arquivo é o "desfazer" de uma migration
// que der errado.
//
//   node scripts/db-backup.mjs
//
// Precisa de SUPABASE_DB_URL no .env.local (Supabase Dashboard -> Project
// Settings -> Database -> Connection string, modo "URI", com a senha) e do
// utilitário `pg_dump` instalado (vem com o PostgreSQL; no Windows, o
// instalador oficial em postgresql.org). Gera backups/<data>.sql, pasta
// ignorada pelo git.

import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local", quiet: true });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Falta SUPABASE_DB_URL no .env.local (connection string do Postgres, com senha).");
  process.exit(2);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.resolve("backups");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${stamp}.sql`);

const result = spawnSync(
  "pg_dump",
  ["--no-owner", "--no-privileges", "--schema=public", "--schema=storage", "--file", outFile, dbUrl],
  { stdio: "inherit" }
);

if (result.error) {
  console.error(`pg_dump não encontrado (${result.error.message}). Instale o PostgreSQL client ou rode o backup pelo Dashboard.`);
  process.exit(2);
}
if (result.status !== 0) {
  console.error(`pg_dump saiu com código ${result.status}`);
  process.exit(result.status ?? 1);
}
console.log(`Backup gravado em ${outFile}`);
