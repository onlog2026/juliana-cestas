import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listAuditLogs } from "@/modules/platform/service";

/**
 * O que cada código gravado no banco quer dizer em português. Se aparecer um
 * código que ainda não está aqui, a tela mostra o código cru em vez de
 * inventar uma tradução.
 */
const ACAO_LABEL: Record<string, string> = {
  loja_ativada_manualmente: "Ativou a loja manualmente",
  vitrine_suspensa: "Suspendeu a vitrine",
  vitrine_reativada: "Reativou a vitrine",
  trial_estendido: "Estendeu o período de teste",
  cortesia_concedida: "Concedeu cortesia",
  cortesia_removida: "Removeu a cortesia",
  plano_alterado: "Trocou o plano da loja",
  entrou_no_painel_da_loja: "Entrou no painel da loja",
  tenant_insert_normalizado: "Loja criada (cobrança zerada pelo sistema)",
  tenant_update_aparado: "Tentativa de alteração bloqueada",
};

type AuditRow = {
  id: string;
  tenant_id: string | null;
  actor_email: string | null;
  action: string;
  target: string | null;
  created_at: string;
};

const dataHoraFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dataHoraFormatter.format(d);
}

export default async function SuperAuditoriaPage() {
  await requireSuperAdmin();
  const registros = (await listAuditLogs(50)) as AuditRow[];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-foreground">Auditoria</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Registro de tudo o que foi mexido nas lojas pela administração da plataforma: quem fez, o que fez e
        quando. É aqui que você descobre, por exemplo, quem entrou no painel de uma loja ou quem liberou uma
        cortesia. Mostra as 50 ações mais recentes, da mais nova para a mais antiga.
      </p>

      {registros.length === 0 ? (
        <div className="mt-6 rounded-card border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Nenhuma ação registrada até agora. Assim que alguém ativar, suspender ou entrar em uma loja, a
            ação aparece nesta lista.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Quem fez</th>
                <th className="px-4 py-3 font-medium">O que fez</th>
                <th className="px-4 py-3 font-medium">Em qual loja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.map((r) => {
                const traduzida = ACAO_LABEL[r.action];
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatarDataHora(r.created_at)}
                    </td>
                    <td className="px-4 py-3 break-all text-foreground">{r.actor_email || "Sistema"}</td>
                    <td className="px-4 py-3 text-foreground">
                      {traduzida ?? <span className="font-mono text-xs">{r.action}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.target || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
