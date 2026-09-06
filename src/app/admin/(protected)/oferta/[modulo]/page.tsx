import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { explainModule, getEntitlements } from "@/modules/entitlements/service";
import { getModule } from "@/lib/modules/registry";

/**
 * A página de oferta de um módulo -- o outro lado do menu que encolhe.
 *
 * Quando uma tela não faz parte do plano, ela não vira erro nem porta fechada:
 * vira esta página, que explica em português o que o recurso faz, diz que ele
 * não está no plano atual e oferece o caminho para contratá-lo.
 *
 * O botão leva para `/admin/assinatura`, onde a lojista vê a situação da
 * conta e pode resgatar uma cortesia. Enquanto essa tela não existia, este
 * botão era um beco sem saída -- fluxo que termina sem próximo passo é ponta
 * solta, não funcionalidade.
 */

const ROTA_ASSINATURA = "/admin/assinatura";

export default async function OfertaModuloPage({ params }: { params: Promise<{ modulo: string }> }) {
  const staff = await requireStaff();
  const { modulo } = await params;
  const slug = decodeURIComponent(modulo ?? "").trim().toLowerCase();

  const definicao = getModule(slug);
  const entitlements = await getEntitlements(staff);
  const acesso = await explainModule(staff, slug);

  // Slug que o sistema não conhece. Não inventamos uma oferta para algo que
  // ninguém sabe entregar -- foi assim que, no Agentop, add-on inventado no
  // painel virou "dinheiro entrando sem entregar produto".
  if (!definicao) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl text-foreground">Recurso não encontrado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Não existe nenhum recurso com o endereço <span className="font-medium text-foreground">{slug || "(vazio)"}</span>.
          Se você chegou aqui por um link antigo, volte para o painel e tente de novo pelo menu.
        </p>
        <VoltarAoPainel />
      </div>
    );
  }

  // Já está liberado (o link ficou velho, ou a cortesia acabou de entrar).
  // Melhor mandar a pessoa direto para a tela do que vender o que ela já tem.
  if (acesso.allowed) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl text-foreground">{definicao.name} já está disponível</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este recurso faz parte do que a sua loja já pode usar. {definicao.description}
        </p>
        {definicao.menu ? (
          <p className="mt-4 text-sm">
            <Link href={definicao.menu.href} className="font-medium text-primary underline underline-offset-4">
              Abrir {definicao.menu.label}
            </Link>
          </p>
        ) : null}
        <VoltarAoPainel />
      </div>
    );
  }

  const nomeDoPlano = entitlements.planName ?? entitlements.planSlug;
  const motivo = textoDoMotivo(acesso.reason, nomeDoPlano);

  return (
    <div className="max-w-2xl">
      <div className="rounded-card border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden="true" /> Recurso disponível em outro plano
        </div>

        <h1 className="mt-3 font-display text-2xl text-foreground">{definicao.name}</h1>
        <p className="mt-2 text-sm text-foreground">{definicao.description}</p>

        <p className="mt-5 text-sm text-muted-foreground">{motivo}</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Enquanto este recurso não estiver no seu plano, ele não aparece no menu do painel. Sua loja continua
          funcionando normalmente para os seus clientes, e nada do que você já cadastrou é apagado.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href={ROTA_ASSINATURA}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Quero este recurso
          </Link>
          <VoltarAoPainel inline />
        </div>
      </div>
    </div>
  );
}

/** Traduz o código do motivo para uma frase que a lojista entende. */
function textoDoMotivo(reason: string, nomeDoPlano: string | null): string {
  const plano = nomeDoPlano ? `no seu plano atual (${nomeDoPlano})` : "no seu plano atual";

  switch (reason) {
    case "addon_nao_contratado":
      return `Este recurso existe ${plano}, mas é contratado à parte. Você pode adicioná-lo quando quiser.`;
    case "teste_vencido":
      return "Seu teste grátis terminou, e este recurso depende de um plano ativo. Escolha um plano para voltar a usá-lo.";
    case "conta_bloqueada":
      return "Sua assinatura está cancelada, e este recurso depende de um plano ativo. Reative seu plano para voltar a usá-lo.";
    case "plano_nao_encontrado":
      return "Não conseguimos identificar o seu plano atual. Fale com o suporte para acertarmos isso -- é rápido.";
    case "sem_plano":
      return "Sua loja ainda não tem um plano escolhido. Escolha um plano para liberar este e outros recursos.";
    default:
      return `Este recurso não está incluído ${plano}. Ele faz parte dos planos maiores.`;
  }
}

function VoltarAoPainel({ inline = false }: { inline?: boolean }) {
  return (
    <p className={inline ? "text-sm" : "mt-6 text-sm"}>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao painel
      </Link>
    </p>
  );
}
