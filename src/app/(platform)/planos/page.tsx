import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Store } from "lucide-react";
import { LandingHeader } from "@/components/platform/landing/header";
import { LandingPlans } from "@/components/platform/landing/plans";
import { LandingClosing } from "@/components/platform/landing/closing";
import { PLATFORM_DEFAULTS, type PlatformContent } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { getPublicPlansPage } from "@/modules/platform/plans-public";

/**
 * Página pública de planos.
 *
 * Existe porque a landing da plataforma já tinha botão apontando para cá — e
 * botão numa página pública que dá 404 é pior que botão nenhum.
 *
 * **Nenhum preço nasce neste arquivo.** Os planos vêm de `subscription_plans`
 * (só `is_visible = true`, na ordem de `sort_order`), com o valor em centavos
 * convertido num lugar só. A seção reaproveitada é a MESMA da landing
 * (`LandingPlans`), de propósito: duas telas mostrando preço com duas regras
 * diferentes é como se chega a duas páginas divergindo sobre quanto custa.
 *
 * `force-dynamic` pelo mesmo motivo da landing: o conteúdo é editável no
 * painel e precisa aparecer na hora, e uma leitura de banco falhando durante o
 * build não pode derrubar o deploy. Não afeta a home da loja (`/`), que é
 * outro grupo de rota e continua estática.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let branding = PLATFORM_DEFAULTS.branding;
  try {
    branding = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[planos] metadados caíram no padrão:", e);
  }

  return {
    title: `Planos — ${branding.wordmark}`,
    description: "Escolha o plano da sua loja. Preço, o que cada plano inclui e como começar.",
    icons: branding.faviconUrl ? { icon: branding.faviconUrl } : undefined,
    robots: { index: true, follow: true },
  };
}

export default async function PlanosPage() {
  let conteudo: PlatformContent;
  try {
    conteudo = await getAllPlatformContent();
  } catch (e) {
    console.error("[planos] conteúdo caiu no padrão:", e);
    conteudo = PLATFORM_DEFAULTS;
  }

  // `plans === null` significa FALHA DE LEITURA; `[]` significa "não há plano
  // publicado". A seção trata os dois casos com textos diferentes, e nenhum
  // deles inventa valor.
  const { plans, trialDays } = await getPublicPlansPage();

  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader branding={conteudo.branding} />

      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <h1 className="max-w-3xl font-display text-[1.9rem] leading-[1.15] text-foreground sm:text-4xl">
              Planos da {conteudo.branding.wordmark}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {trialDays !== null && trialDays > 0
                ? `Você começa com ${trialDays} ${trialDays === 1 ? "dia" : "dias"} de teste, sem cartão. A escolha do plano acontece depois, dentro do painel — e só então existe cobrança.`
                : "Você monta a loja, publica e escolhe o plano dentro do painel. Nenhuma cobrança acontece no cadastro."}
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              <Garantia icone="teste" texto="Sem cartão para começar" />
              <Garantia icone="sair" texto="Cancelamento a qualquer momento" />
              <Garantia icone="loja" texto="Sua loja no ar no mesmo dia" />
            </ul>
          </div>
        </section>

        <LandingPlans intro={conteudo.plans_intro} plans={plans} />

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl text-foreground">Ainda em dúvida?</h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Crie sua loja no teste e experimente com produtos de verdade. Você só escolhe o plano quando
              decidir continuar — e o que você montou continua lá.
            </p>
            {/* Âncora comum, e não `Link`: a página vive no mesmo grupo de rota,
                mas o destino carrega parâmetro montado aqui. */}
            <a
              href="/cadastro"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar minha loja
            </a>
          </div>
        </section>
      </main>

      <LandingClosing closing={conteudo.closing} wordmark={conteudo.branding.wordmark} />
    </div>
  );
}

/**
 * Ícone escolhido por NOME, resolvido aqui dentro. Componente de ícone nunca
 * atravessa a fronteira servidor → cliente — é a mesma regra do resto da
 * landing (`src/modules/platform/landing-content.ts`).
 */
function Garantia({ icone, texto }: { icone: "teste" | "sair" | "loja"; texto: string }) {
  const Icone = icone === "teste" ? Sparkles : icone === "sair" ? ShieldCheck : Store;
  return (
    <li className="flex items-start gap-2.5 rounded-[10px] border border-border bg-card px-4 py-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="text-sm text-foreground">{texto}</span>
    </li>
  );
}
