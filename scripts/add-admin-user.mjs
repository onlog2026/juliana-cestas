// Cria (ou atualiza a senha de) um usuario admin adicional.
// Uso: node scripts/add-admin-user.mjs <email> <senha>
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const TENANT_ID = "a0000000-0000-4000-8000-000000000001";
const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Uso: node scripts/add-admin-user.mjs <email> <senha>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (found) {
    userId = found.id;
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log("Senha atualizada para usuário existente.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Usuário criado.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, tenant_id: TENANT_ID, role: "admin", name: email.split("@")[0] }, { onConflict: "id" });
  if (profileError) throw profileError;

  console.log("Admin pronto:", email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
