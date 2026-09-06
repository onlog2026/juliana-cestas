import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  // Aqui ninguém está logado ainda: a loja vem do endereço acessado.
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "";

  return <AdminLoginForm storeName={storeName} />;
}
