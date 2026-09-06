import type { Metadata } from "next";
import { getEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { getStoreOfUser, painelUrlDaLoja } from "@/modules/platform/onboarding";
import { getPublicPlansPage } from "@/modules/platform/plans-public";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { LandingHeader } from "@/components/platform/landing/header";
import { SignupWizard } from "@/components/platform/signup/signup-wizard";

/**
 * Criar a própria loja (auto-atendimento).
 *
 * Tudo que decide dinheiro fica NESTE lado da fronteira:
 *   * o plano vindo em `?plano=` é apenas CONFERIDO contra os planos reais e
 *     usado para escrever o nome na tela — ele não é gravado em lugar nenhum.
 *     Quem define plano é o pagamento confirmado, nunca a URL;
 *   * os dias de teste vêm de `saas_config`, no servidor;
 *   * quem cria a loja é a Server Action, com service role, a partir do
 *     usuário da sessão — nunca de um id mandado pelo formulário.
 *
 * A página é dinâmica porque lê a sessão. Isso não afeta a home da loja (`/`),
 * que é outro grupo de rota e continua estática.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar minha loja",
  description: "Crie sua loja em poucos minutos e comece no teste grátis.",
  robots: { index: true, follow: true },
};

/** Data amigável, com fuso fixo: o servidor e o navegador precisam concordar. */
const DATA_BR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return DATA_BR.format(d);
}

export default async function CadastroPage(props: PageProps<"/cadastro">) {
  const { plano } = await props.searchParams;
  const planoPedido = typeof plano === "string" ? plano.trim().toLowerCase() : "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let branding = PLATFORM_DEFAULTS.branding;
  try {
    branding = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[cadastro] conteúdo caiu no padrão:", e);
  }

  const { plans, trialDays } = await getPublicPlansPage();

  // O nome do plano só aparece se ele EXISTIR e estiver visível. `?plano=` é
  // texto vindo da URL: sem esta conferência, qualquer um faria a tela exibir
  // "Plano Ouro Ilimitado" só mudando o endereço.
  const planoEscolhido = planoPedido
    ? ((plans ?? []).find((p) => p.slug === planoPedido)?.name ?? null)
    : null;

  const loja = user ? await getStoreOfUser(user.id) : null;

  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader branding={branding} />

      <main className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-xl">
            <h1 className="font-display text-[1.7rem] leading-[1.15] text-foreground sm:text-3xl">
              {loja ? "Sua loja já está criada" : "Crie sua loja"}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {loja
                ? "Você já tem uma loja nesta conta. Abaixo está o que você precisa para abri-la."
                : "São dois passos. Nenhum cartão é pedido e você pode mudar tudo depois."}
            </p>
          </div>

          <div className="mt-8">
            <SignupWizard
              logado={Boolean(user)}
              emailDaConta={user?.email ?? null}
              nomeSugerido={
                (user?.user_metadata?.name as string | undefined)?.trim() ||
                (user?.user_metadata?.full_name as string | undefined)?.trim() ||
                null
              }
              lojaExistente={
                loja
                  ? {
                      nome: loja.nome,
                      slug: loja.slug,
                      painelUrl: painelUrlDaLoja(
                        loja.slug,
                        loja.tenantId === LEGACY_TENANT_ID,
                        getEnv().PLATFORM_DOMAIN
                      ),
                      fimDoTesteTexto: formatarData(loja.trialEndsAt),
                      jaExistia: true,
                    }
                  : null
              }
              planoEscolhido={planoEscolhido}
              trialDays={trialDays}
              dominioDaPlataforma={getEnv().PLATFORM_DOMAIN || null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
