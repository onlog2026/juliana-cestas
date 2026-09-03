import { getStoreProfile } from "@/modules/settings/store-profile";
import { StoreProfileForm } from "@/components/admin/store-profile-form";

export default async function AdminConfiguracoesPage() {
  const profile = await getStoreProfile();

  return (
    <div className="max-w-[900px]">
      <h1 className="font-display text-2xl text-foreground">Dados cadastrais</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informações da loja: nome, documento, contato e endereço. Aparecem no rodapé do site.
      </p>

      <div className="mt-6 rounded-card border border-border bg-card p-5 lg:p-6">
        <StoreProfileForm profile={profile} />
      </div>
    </div>
  );
}
