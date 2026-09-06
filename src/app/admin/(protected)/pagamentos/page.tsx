import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/require-staff";
import { getAccountStatus } from "@/modules/payments/accounts";
import { AsaasConnectForm } from "@/components/admin/asaas-connect-form";

export const metadata: Metadata = { title: "Pagamentos" };

/**
 * Tela do lojista para conectar a conta de recebimento.
 *
 * Server Component: lê a situação pelo servidor (a tabela
 * `tenant_payment_accounts` é invisível para o navegador por RLS) e passa para
 * o formulário apenas dados serializáveis — nenhum ícone, nenhuma função.
 */
export default async function AdminPagamentosPage() {
  const staff = await requireStaff();
  const status = await getAccountStatus(staff.tenantId);

  return (
    <div className="max-w-[900px]">
      <h1 className="font-display text-2xl text-foreground">Pagamentos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conecte a conta do Asaas da sua loja para receber Pix, boleto e cartão direto pelo site.
      </p>

      <div className="mt-6">
        <AsaasConnectForm
          account={{
            connected: status.connected,
            environment: status.environment,
            keyLast4: status.keyLast4,
            accountName: status.accountName,
            accountEmail: status.accountEmail,
            webhookRegistered: status.webhookRegistered,
            connectedAt: status.connectedAt,
            lastError: status.lastError,
            cryptoReady: status.cryptoReady,
          }}
        />
      </div>
    </div>
  );
}
