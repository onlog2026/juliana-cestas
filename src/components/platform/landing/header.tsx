import Link from "next/link";
import Image from "next/image";
import { Store } from "lucide-react";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * Topo da landing da plataforma.
 *
 * Sem `backdrop-filter`/`blur` de propósito: em elemento fixo/grudado isso trava
 * a rolagem no celular (regra da casa, nasceu de travamento real). Fundo sólido
 * resolve e não custa nada.
 */
export function LandingHeader({ branding }: { branding: PlatformContent["branding"] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* `min-h-11`: alvo de toque de 44px também no logotipo -- sem isso a
            altura era a da imagem (32px) e o link ficava difícil de acertar. */}
        <a href="/plataforma" className="flex min-h-11 min-w-0 items-center gap-2">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.wordmark}
              width={180}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          ) : (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                <Store className="size-4" />
              </span>
              <span className="truncate font-display text-lg text-foreground">{branding.wordmark}</span>
            </>
          )}
        </a>

        {/* `shrink-0` + `whitespace-nowrap`: em 375px é o NOME da plataforma
            que encolhe (ele tem `truncate`), nunca os botões -- botão espremido
            quebra o texto em duas linhas e estoura a altura do cabeçalho. */}
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/admin/login"
            className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-4"
          >
            Entrar
          </Link>
          {/* Âncora comum (não `Link`): /cadastro é a próxima fase e ainda não
              existe como rota -- com rotas tipadas, `Link` não compilaria. */}
          <a
            href="/cadastro"
            className="inline-flex h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90 sm:px-5"
          >
            <span className="sm:hidden">Criar loja</span>
            <span className="hidden sm:inline">Criar minha loja</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
