import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getEntitlements } from "@/modules/entitlements/service";
import {
  avaliarLimiteEquipe,
  contarAtivos,
  getLimitePlanoEquipe,
  listTeamInvites,
  listTeamMembers,
  modulosParaPermissao,
} from "@/modules/team/service";
import { TeamManager } from "@/components/admin/team-manager";

export default async function AdminEquipePage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de digitar
  // este endereço na barra do navegador. Quem chega aqui sem o módulo "equipe"
  // no plano é levado para a página de oferta.
  const staff = await requireStaffWithModule("equipe");

  const [membros, convites, limitePlano, entitlements] = await Promise.all([
    listTeamMembers(staff.tenantId),
    listTeamInvites(staff.tenantId),
    getLimitePlanoEquipe(staff.tenantId),
    getEntitlements(staff),
  ]);

  const pendentes = convites.filter((c) => !c.aceito && !c.vencido).length;
  const limite = avaliarLimiteEquipe(limitePlano, contarAtivos(membros), pendentes);
  // Só se pode dar a alguém o que a LOJA tem. A lista sai do plano, não de uma
  // relação escrita à mão que um dia diverge do que o plano realmente libera.
  const modulos = modulosParaPermissao(entitlements.allowed);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-foreground">Equipe</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Quem pode entrar no painel da loja e o que cada pessoa consegue abrir. Ninguém recebe senha por aqui: o
        convite chega no e-mail e a própria pessoa escolhe a senha dela.
      </p>

      <div className="mt-6">
        <TeamManager
          members={membros}
          invites={convites}
          limite={limite}
          modulos={modulos}
          meuId={staff.id}
        />
      </div>
    </div>
  );
}
