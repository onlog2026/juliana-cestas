// Cria (ou atualiza a senha do) usuário admin da loja e garante o profile
// com role='admin'. Roda uma vez, localmente: node scripts/create-admin-user.mjs
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import crypto from "node:crypto";

config({ path: ".env.local" });

const TENANT_ID = "a0000000-0000-4000-8000-000000000001";
const ADMIN_EMAIL = "contatoagentop@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const password = crypto.randomBytes(9).toString("base64url");

async function main() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  let userId;
  if (found) {
    userId = found.id;
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log("Senha do admin redefinida.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Usuário admin criado.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, tenant_id: TENANT_ID, role: "admin", name: "Juliana" }, { onConflict: "id" });
  if (profileError) throw profileError;

  console.log("---");
  console.log("E-mail:", ADMIN_EMAIL);
  console.log("Senha temporária:", password);
  console.log("---");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
