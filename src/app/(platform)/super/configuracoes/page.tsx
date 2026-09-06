import { CircleCheck, CircleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getPlatformConfig, getEnvHealth } from "@/modules/platform/config-service";
import { listPlatformModules } from "@/modules/platform/vouchers-service";
import { ConfigForm } from "@/components/platform/config-form";

export const dynamic = "force-dynamic";

const dataHoraFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatarDataHora(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return dataHoraFormatter.format(data);
}

const cardClass = "rounded-card border border-border bg-card p-5";

export default async function SuperConfiguracoesPage() {
  await requireSuperAdmin();

  const [config, modulos] = await Promise.all([getPlatformConfig(), listPlatformModules()]);
  // Leitura de variável de ambiente é síncrona e roda só no servidor. O VALOR
  // nunca sai daqui -- só "configurada" ou "faltando".
  const ambiente = getEnvHealth();

  const faltando = ambiente.filter((item) => !item.configurada);
  const ultimaEdicao = formatarDataHora(config.updatedAt);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Configurações da plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As regras que valem para <strong>todas as lojas</strong>. O que você mudar aqui passa a valer na hora, para
          todo mundo.
        </p>
        {ultimaEdicao ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Última alteração em {ultimaEdicao}
            {config.updatedBy ? ` por ${config.updatedBy}` : ""}.
          </p>
        ) : null}
      </div>

      {!config.linhaExiste ? (
        <div className="rounded-card border border-amber-300 bg-amber-100 p-4">
          <p className="text-sm text-amber-900">
            <strong>Atenção:</strong> ainda não existe nenhuma configuração gravada no banco. Os valores abaixo são os
            padrões do sistema, não algo que alguém salvou. Assim que você clicar em &quot;Salvar configuração&quot;, a
            configuração passa a existir de verdade.
          </p>
        </div>
      ) : null}

      <ConfigForm
        inicial={{
          platformName: config.platformName,
          supportEmail: config.supportEmail,
          trialDays: config.trialDays,
          trialModuleSlugs: config.trialModuleSlugs,
          storefrontGraceDays: config.storefrontGraceDays,
        }}
        modulos={modulos.map((m) => ({
          slug: m.slug,
          name: m.name,
          description: m.description,
          category: m.category,
          isCore: m.isCore,
        }))}
      />

      {/* Saúde do ambiente: só leitura, nada aqui é editável pelo painel.
          Variável de ambiente se troca na hospedagem (Vercel), não no site. */}
      <div className={cardClass}>
        <h2 className="font-display text-xl text-foreground">Saúde do ambiente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          São as chaves e endereços que o sistema precisa ter configurados na hospedagem para funcionar. Esta lista é
          só de leitura: nada aqui é editável pelo painel, e{" "}
          <strong>o valor de cada chave nunca é mostrado nesta tela</strong> — só se ela está configurada ou não.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {faltando.length === 0 ? (
            <span className="text-green-700">
              Tudo configurado. Nenhuma das chaves críticas está faltando neste ambiente.
            </span>
          ) : (
            <span className="text-amber-900">
              {faltando.length === 1
                ? "1 item está faltando — veja abaixo o que para de funcionar por causa dele."
                : `${faltando.length} itens estão faltando — veja abaixo o que para de funcionar por causa deles.`}
            </span>
          )}
        </p>

        <div className="mt-4 space-y-2">
          {ambiente.map((item) => (
            <div
              key={item.nome}
              className="flex flex-col gap-2 rounded-[10px] border border-border bg-background p-3.5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-sm font-semibold break-all text-foreground">{item.nome}</code>
                  {item.configurada ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                      <CircleCheck className="size-3.5" /> Configurada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                      <CircleAlert className="size-3.5" /> Faltando
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.paraQueServe}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Se faltar: </span>
                  {item.seFaltar}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Para corrigir um item faltando, a alteração é feita na hospedagem (Vercel), em Settings → Environment
          Variables, e depois é preciso publicar o site de novo para o valor novo passar a valer.
        </p>
      </div>
    </div>
  );
}
