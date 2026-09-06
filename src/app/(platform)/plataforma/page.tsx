import type { Metadata } from "next";
import { LandingHeader } from "@/components/platform/landing/header";
import { LandingHero } from "@/components/platform/landing/hero";
import { LandingAudiences } from "@/components/platform/landing/audiences";
import { LandingFeatures } from "@/components/platform/landing/features";
import { LandingSteps } from "@/components/platform/landing/steps";
import { LandingPlans } from "@/components/platform/landing/plans";
import { LandingFaq } from "@/components/platform/landing/faq";
import { LandingClosing } from "@/components/platform/landing/closing";
import { PLATFORM_DEFAULTS, type PlatformContent } from "@/modules/platform/landing-content";
import { getAllPlatformContent, listPublicPlans, type PublicPlan } from "@/modules/platform/landing-service";

/**
 * Landing pública da PLATAFORMA -- a página que vende a plataforma para novos
 * lojistas. Não tem nada a ver com a vitrine de nenhuma loja.
 *
 * `force-dynamic` de propósito, por dois motivos:
 *   1. o conteúdo é editável no painel e tem que aparecer na hora;
 *   2. sem isso a página seria pré-renderizada no BUILD, e uma leitura do
 *      banco falhando durante o build derrubaria o deploy inteiro.
 * Isto não afeta a home da loja (`/`), que continua estática -- são grupos de
 * rota separados e esta página não lê `headers()` de ninguém.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // Metadado não pode derrubar a página: se o banco não responder, usa o
  // padrão. (O conteúdo em si tem o mesmo tratamento, mais abaixo.)
  let branding = PLATFORM_DEFAULTS.branding;
  let hero = PLATFORM_DEFAULTS.hero;
  try {
    const conteudo = await getAllPlatformContent();
    branding = conteudo.branding;
    hero = conteudo.hero;
  } catch (e) {
    console.error("[landing] metadados caíram no padrão:", e);
  }

  return {
    title: `${branding.wordmark} — sua loja virtual no ar`,
    description: hero.subtitle || hero.title,
    icons: branding.faviconUrl ? { icon: branding.faviconUrl } : undefined,
    openGraph: {
      title: `${branding.wordmark} — sua loja virtual no ar`,
      description: hero.subtitle || hero.title,
      type: "website",
    },
  };
}

export default async function PlataformaLandingPage() {
  // Conteúdo: se o banco não responder, a página ainda precisa vender. O texto
  // padrão é texto de verdade (não uma lista vazia), então cair nele é honesto.
  // O erro fica registrado no log do servidor, nunca engolido.
  let conteudo: PlatformContent;
  try {
    conteudo = await getAllPlatformContent();
  } catch (e) {
    console.error("[landing] conteúdo caiu no padrão:", e);
    conteudo = PLATFORM_DEFAULTS;
  }

  // Planos: aqui é o contrário. Lista vazia por falha de leitura viraria
  // "esta plataforma não tem planos" -- mentira. `null` marca a falha e a
  // seção mostra um recado honesto em vez de preço inventado.
  // O detalhe técnico fica só aqui, no log do servidor: mostrar a mensagem do
  // PostgREST numa página pública entrega nome de tabela e de esquema.
  let planos: PublicPlan[] | null = null;
  try {
    planos = await listPublicPlans();
  } catch (e) {
    console.error("[landing] falha ao ler os planos:", e);
  }

  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader branding={conteudo.branding} />
      <main>
        <LandingHero hero={conteudo.hero} />
        <LandingAudiences audiences={conteudo.audiences} />
        <LandingFeatures features={conteudo.features} />
        <LandingSteps steps={conteudo.steps} />
        <LandingPlans intro={conteudo.plans_intro} plans={planos} />
        <LandingFaq faq={conteudo.faq} />
      </main>
      <LandingClosing closing={conteudo.closing} wordmark={conteudo.branding.wordmark} />
    </div>
  );
}
