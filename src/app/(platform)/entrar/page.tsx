import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { getEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSuperAdminEmail } from "@/lib/platform/super-admins";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { getStoreOfUser, painelUrlDaLoja } from "@/modules/platform/onboarding";
import { PlatformLoginForm } from "@/components/platform/signup/login-form";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { LandingHeader } from "@/components/platform/landing/header";

/**
 * Entrar na plataforma.
 *
 * A decisão de PARA ONDE ir depois do login é tomada aqui, no servidor, porque
 * depende de duas coisas que o navegador não pode saber: se a pessoa tem loja
 * e qual é. Por isso o formulário, ao terminar, só navega de volta para cá.
 *
 * Três destinos possíveis:
 *   1. dono da plataforma  → `/super`;
 *   2. tem loja            → o painel DELA;
 *   3. não tem loja        → `/cadastro`.
 *
 * O login em si é o mesmo mecanismo do cliente da loja (Supabase Auth, Google
 * ou e-mail/senha) e a mesma rota de retorno `/auth/callback`. Nenhuma linha
 * deste projeto cria, guarda ou compara senha.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para abrir o painel da sua loja.",
  robots: { index: false, follow: false },
};

export default async function EntrarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let branding = PLATFORM_DEFAULTS.branding;
  try {
    branding = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[entrar] conteúdo caiu no padrão:", e);
  }

  // Ainda não entrou: mostra o formulário.
  if (!user) {
    return (
      <div className="min-h-dvh bg-background">
        <LandingHeader branding={branding} />
        <main className="flex min-h-[calc(100dvh-4rem)] items-start justify-center bg-secondary/40 px-4 py-10 sm:items-center sm:py-14">
          <PlatformLoginForm />
        </main>
      </div>
    );
  }

  // O dono da plataforma tem painel próprio e pode nem ter loja.
  if (isSuperAdminEmail(user.email)) redirect("/super");

  const loja = await getStoreOfUser(user.id);

  // Entrou, mas ainda não tem loja: o caminho natural é criar a dela.
  if (!loja) redirect("/cadastro");

  const painelUrl = painelUrlDaLoja(
    loja.slug,
    loja.tenantId === LEGACY_TENANT_ID,
    getEnv().PLATFORM_DOMAIN
  );

  if (painelUrl) redirect(painelUrl);

  // Tem loja, mas a loja ainda não tem endereço próprio (PLATFORM_DOMAIN não
  // configurada). Mandar para `/admin` aqui abriria o painel da loja LEGADA,
  // que recusaria esta conta — a pessoa veria "e-mail ou senha incorretos"
  // logo depois de ter entrado, e isso não é o que está acontecendo.
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader branding={branding} />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-card border border-border bg-card p-6 shadow-[var(--jc-shadow)] sm:p-8">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <h1 className="font-display text-xl text-foreground">
                Sua loja existe, mas ainda não tem endereço próprio
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Você entrou como <span className="font-medium text-foreground">{user.email}</span> e a loja{" "}
                <span className="font-medium text-foreground">{loja.nome}</span> está criada. O endereço de
                cada loja depende de uma configuração da plataforma que ainda não foi ligada, então não há
                painel para abrir agora.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nada foi perdido: seus dados continuam salvos. Fale com o suporte para liberarem o acesso.
              </p>
            </div>
          </div>

          <Link
            href="/plataforma"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full border border-primary/30 text-sm font-semibold text-primary transition-colors hover:bg-accent"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </main>
    </div>
  );
}
