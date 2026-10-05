import type { ReactNode } from "react";
import "@/styles/plataforma.css";
import { RECURSOS } from "@/modules/platform/recursos";
import { SOLUCOES } from "@/modules/platform/solucoes";
import { PLATFORM_DEFAULTS } from "@/modules/platform/landing-content";
import { getAllPlatformContent } from "@/modules/platform/landing-service";
import { fonteDisplay, fonteTexto } from "./fonts";
import { Cabecalho } from "./cabecalho";
import { Rodape } from "./rodape";
import { BarraApp } from "./barra-app";

/**
 * CONTRATO do site da plataforma. Toda página pública da plataforma (home, recursos, soluções,
 * planos, modelos, cadastro…) se envolve em <PlataformaShell>. Ele traz o escopo visual
 * (`data-surface="plataforma"`: tinta escura + papel + âmbar, fontes Bricolage Grotesque e DM Sans),
 * o cabeçalho com menus, o rodapé e a barra de aplicativo do celular.
 *
 * O nome da plataforma vem da marca editável em /super/marca; se o banco não responder, usa o padrão
 * (o shell nunca derruba a página).
 */
export async function PlataformaShell({ children }: { children: ReactNode }) {
  let marca = PLATFORM_DEFAULTS.branding;
  try {
    marca = (await getAllPlatformContent()).branding;
  } catch (e) {
    console.error("[shell] marca caiu no padrão:", e);
  }

  const recursos = RECURSOS.map((r) => ({
    slug: r.slug,
    titulo: r.titulo,
    resumo: r.resumo,
    icone: r.icone,
    status: r.status,
  }));
  const solucoes = SOLUCOES.map((s) => ({ slug: s.slug, titulo: s.titulo, resumo: s.resumo }));

  return (
    <div data-surface="plataforma" className={`plt-root ${fonteDisplay.variable} ${fonteTexto.variable}`}>
      <a href="#conteudo" className="plt-pular">Pular para o conteúdo</a>
      <Cabecalho nome={marca.wordmark} logoUrl={marca.logoUrl} recursos={recursos} solucoes={solucoes} />
      <div id="conteudo" tabIndex={-1} className="plt-conteudo">
        {children}
      </div>
      <Rodape nome={marca.wordmark} recursos={recursos} solucoes={solucoes} />
      <BarraApp />
    </div>
  );
}
