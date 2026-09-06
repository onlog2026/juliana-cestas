import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/require-staff";
import { getEntitlements } from "@/modules/entitlements/service";
import { MODULE_REGISTRY } from "@/lib/modules/registry";
import { VoucherRedeemForm } from "@/components/admin/voucher-redeem-form";

export const metadata: Metadata = { title: "Sua assinatura" };
export const dynamic = "force-dynamic";

/**
 * A tela onde a lojista vê a própria situação e resgata uma cortesia.
 *
 * É o destino do botão "Quero este recurso" da página de oferta e do banner de
 * teste. Antes dela, esses dois caminhos terminavam em 404 -- fluxo que acaba
 * sem próximo passo é ponta solta, não funcionalidade.
 *
 * O que esta tela AINDA NÃO faz: contratar plano com cobrança. Isso depende da
 * conta Asaas da plataforma, que ainda não existe. Em vez de mostrar um botão
 * "Assinar" que não cobra nada, a tela diz a verdade e manda falar com a gente.
 */

const ESTADO_TEXTO: Record<string, { titulo: string; detalhe: string; alerta: boolean }> = {
  ok: {
    titulo: "Sua conta está em dia",
    detalhe: "Todos os recursos do seu plano estão liberados.",
    alerta: false,
  },
  teste: {
    titulo: "Você está no período de teste",
    detalhe: "Durante o teste você usa a plataforma sem pagar nada.",
    alerta: false,
  },
  teste_vencido: {
    titulo: "Seu período de teste terminou",
    detalhe:
      "Sua loja continua no ar e seus dados estão todos aqui. Para voltar a usar os recursos que sumiram do menu, é preciso contratar um plano.",
    alerta: true,
  },
  atrasado: {
    titulo: "Há uma mensalidade em atraso",
    detalhe:
      "Regularize para não perder recursos. Se o atraso continuar, a sua loja sai do ar temporariamente — mas este painel continua aberto e nada é apagado.",
    alerta: true,
  },
  bloqueado: {
    titulo: "Seu acesso está limitado",
    detalhe:
      "Só as configurações e esta tela continuam abertas. Nenhum dado seu foi apagado: assim que a situação for regularizada, tudo volta como estava.",
    alerta: true,
  },
};

export default async function AssinaturaPage() {
  const staff = await requireStaff();
  const ent = await getEntitlements(staff);

  const estado = ESTADO_TEXTO[ent.state] ?? ESTADO_TEXTO.ok;
  const liberados = MODULE_REGISTRY.filter((m) => ent.allowed.includes(m.slug));
  const bloqueados = MODULE_REGISTRY.filter((m) => !ent.allowed.includes(m.slug));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-foreground">Sua assinatura</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        O que está liberado na sua loja hoje e como liberar o resto.
      </p>

      {ent.degradado ? (
        <p className="mt-4 rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Não consegui confirmar o seu plano no banco agora, então liberei tudo por segurança. Isso
          costuma se resolver sozinho — se esta mensagem continuar aparecendo amanhã, me avise.
        </p>
      ) : null}

      <section
        className={`mt-5 rounded-card border p-5 ${
          estado.alerta ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
        }`}
      >
        <p className="text-base font-semibold text-foreground">{estado.titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{estado.detalhe}</p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Plano atual</dt>
            <dd className="text-sm font-medium text-foreground">
              {ent.planName ?? ent.planSlug ?? "Nenhum plano contratado"}
            </dd>
          </div>
          {ent.diasDeTesteRestantes !== null ? (
            <div>
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">Teste</dt>
              <dd className="text-sm font-medium text-foreground">
                {ent.diasDeTesteRestantes > 0
                  ? `Faltam ${ent.diasDeTesteRestantes} ${ent.diasDeTesteRestantes === 1 ? "dia" : "dias"}`
                  : "Terminou"}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="mt-5 rounded-card border border-border bg-card p-5">
        <p className="text-base font-semibold text-foreground">Tenho um código de cortesia</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Se você recebeu um código, digite abaixo para liberar o acesso na hora.
        </p>
        <VoucherRedeemForm />
      </section>

      <section className="mt-5 rounded-card border border-border bg-card p-5">
        <p className="text-base font-semibold text-foreground">Contratar ou trocar de plano</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A contratação com pagamento automático ainda está sendo ligada. Por enquanto, fale com a
          gente que ajustamos o seu plano na hora — nenhuma cobrança acontece sem você aprovar.
        </p>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Liberado para você</p>
          <ul className="mt-2 space-y-1">
            {liberados.map((m) => (
              <li key={m.slug} className="text-sm text-muted-foreground">
                {m.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Ainda não liberado</p>
          {bloqueados.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Você tem acesso a tudo que a plataforma oferece hoje.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {bloqueados.map((m) => (
                <li key={m.slug} className="text-sm text-muted-foreground">
                  {m.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
