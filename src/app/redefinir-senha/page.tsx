import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default async function RedefinirSenhaPage() {
  // Aqui ninguém está logado ainda: a loja vem do endereço acessado.
  const profile = await getStoreProfile(await getTenantId());
  const storeName = profile.businessName?.trim() || "";

  return <ResetPasswordForm storeName={storeName} />;
}
