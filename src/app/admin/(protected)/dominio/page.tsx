import { requireStaffWithModule } from "@/lib/auth/require-module";
import { listTenantDomains } from "@/modules/domains/service";
import { DomainConnectForm } from "@/components/admin/domain-connect-form";

export default async function AdminDominioPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de digitar
  // este endereço na barra do navegador. Quem chega aqui sem o módulo
  // "dominio" no plano é levado para a página de oferta.
  const staff = await requireStaffWithModule("dominio");

  const domains = await listTenantDomains(staff.tenantId);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">Domínio próprio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use o endereço da sua loja em vez do endereço padrão da plataforma. Cadastre o domínio abaixo, configure o
        DNS no painel de onde você comprou o domínio e confira quando estiver pronto.
      </p>
      <p className="mt-2 rounded-[10px] bg-secondary/50 p-3 text-xs text-muted-foreground">
        Esta tela cadastra o domínio e confere o DNS. A ativação de verdade -- o domínio passar a responder pela
        loja de fato -- depende de uma etapa que a plataforma ainda vai disponibilizar. Enquanto isso não acontece,
        sua loja continua funcionando normalmente pelo endereço de sempre.
      </p>

      <div className="mt-6">
        <DomainConnectForm domains={domains} />
      </div>
    </div>
  );
}
