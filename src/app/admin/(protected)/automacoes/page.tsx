import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getCartRecoveryRule, countCartRecoverySentLast30Days } from "@/modules/automations/service";
import { AutomationRules } from "@/components/admin/automation-rules";

/**
 * Painel de automações da lojista.
 *
 * O gate é `requireStaffWithModule("automacoes")`: confere sessão de staff
 * DESTA loja e o direito ao módulo no plano. Esconder o item do menu não é
 * trava — quem sabe o endereço digita `/admin/automacoes` e entra.
 */
export default async function AdminAutomacoesPage() {
  const staff = await requireStaffWithModule("automacoes");

  const [rule, sentLast30Days] = await Promise.all([
    getCartRecoveryRule(staff.tenantId),
    countCartRecoverySentLast30Days(staff.tenantId),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">Automações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        E-mails automáticos que a loja manda sozinha, sem você precisar lembrar.
      </p>

      <div className="mt-6">
        <AutomationRules rule={rule} sentLast30Days={sentLast30Days} />
      </div>
    </div>
  );
}
