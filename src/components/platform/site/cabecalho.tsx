"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { Icone } from "./icones";

export type ItemRecurso = { slug: string; titulo: string; resumo: string; icone: string; status: "disponivel" | "em-breve" };
export type ItemSolucao = { slug: string; titulo: string; resumo: string };

type Props = {
  nome: string;
  logoUrl: string;
  recursos: ItemRecurso[];
  solucoes: ItemSolucao[];
};

/**
 * Cabeçalho da plataforma: tinta escura, mega-menu de Recursos e menu de Soluções no computador,
 * gaveta no celular. Sem blur (elemento grudado + blur trava a rolagem no celular).
 * Tudo abre por clique/teclado: Esc fecha, clicar fora fecha.
 */
export function Cabecalho({ nome, logoUrl, recursos, solucoes }: Props) {
  const [aberto, setAberto] = useState<"recursos" | "solucoes" | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const raiz = useRef<HTMLElement>(null);
  const caminho = usePathname();

  // Navegou? fecha tudo (ajuste de estado durante a renderização, sem efeito).
  const [caminhoAnterior, setCaminhoAnterior] = useState(caminho);
  if (caminhoAnterior !== caminho) {
    setCaminhoAnterior(caminho);
    setAberto(null);
    setGaveta(false);
  }

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(null);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  // Gaveta aberta: trava a rolagem do fundo e deixa o Esc fechar.
  useEffect(() => {
    if (!gaveta) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGaveta(false);
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", tecla);
    };
  }, [gaveta]);

  const alterna = (qual: "recursos" | "solucoes") => setAberto((a) => (a === qual ? null : qual));

  return (
    <header ref={raiz} className="plt-header">
      <div className="plt-wrap plt-header-linha">
        <Link href="/inicio" className="plt-logo" aria-label={`${nome} — página inicial`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={nome} className="plt-logo-img" height={32} />
          ) : (
            <>
              <span className="plt-logo-marca" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10h18l-1.6 9a2 2 0 0 1-2 1.6H6.6a2 2 0 0 1-2-1.6L3 10Z" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <span className="plt-logo-nome">{nome}</span>
            </>
          )}
        </Link>

        <nav className="plt-nav" aria-label="Principal">
          <button
            type="button"
            className="plt-nav-item"
            aria-expanded={aberto === "recursos"}
            aria-controls="plt-mega-recursos"
            onClick={() => alterna("recursos")}
          >
            Recursos <ChevronDown className="plt-chevron" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="plt-nav-item"
            aria-expanded={aberto === "solucoes"}
            aria-controls="plt-menu-solucoes"
            onClick={() => alterna("solucoes")}
          >
            Soluções <ChevronDown className="plt-chevron" aria-hidden="true" />
          </button>
          <Link href="/modelos" className="plt-nav-item">Modelos</Link>
          <Link href="/planos" className="plt-nav-item">Preços</Link>
        </nav>

        <div className="plt-header-acoes">
          <Link href="/entrar" className="plt-btn-link plt-so-desktop">Entrar</Link>
          <Link href="/cadastro" className="plt-btn plt-btn-ambar plt-btn-sm">Criar loja grátis</Link>
          <button
            type="button"
            className="plt-icone-btn plt-so-celular"
            aria-label="Abrir menu"
            aria-expanded={gaveta}
            aria-controls="plt-gaveta"
            onClick={() => setGaveta(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mega-menu de Recursos (computador) */}
      {aberto === "recursos" ? (
        <div id="plt-mega-recursos" className="plt-mega" role="region" aria-label="Recursos">
          <div className="plt-wrap">
            <ul className="plt-mega-grade">
              {recursos.map((r) => (
                <li key={r.slug}>
                  <Link href={`/recursos/${r.slug}`} className="plt-mega-item">
                    <span className="plt-mega-icone"><Icone nome={r.icone} /></span>
                    <span className="plt-mega-texto">
                      <span className="plt-mega-titulo">
                        {r.titulo}
                        {r.status === "em-breve" ? <span className="plt-selo-breve">Em breve</span> : null}
                      </span>
                      <span className="plt-mega-resumo">{r.resumo}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="plt-mega-rodape">
              <Link href="/recursos" className="plt-seta-link">Ver todos os recursos <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Menu de Soluções (computador) */}
      {aberto === "solucoes" ? (
        <div id="plt-menu-solucoes" className="plt-mega plt-mega-curto" role="region" aria-label="Soluções">
          <div className="plt-wrap">
            <ul className="plt-mega-grade plt-mega-grade-2">
              {solucoes.map((s) => (
                <li key={s.slug}>
                  <Link href={`/solucoes/${s.slug}`} className="plt-mega-item">
                    <span className="plt-mega-texto">
                      <span className="plt-mega-titulo">{s.titulo}</span>
                      <span className="plt-mega-resumo">{s.resumo}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="plt-mega-rodape">
              <Link href="/solucoes" className="plt-seta-link">Ver todas as situações <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Gaveta (celular) */}
      {gaveta ? (
        <div className="plt-gaveta-fundo" onClick={() => setGaveta(false)}>
          <div
            id="plt-gaveta"
            className="plt-gaveta"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plt-gaveta-topo">
              <span className="plt-logo-nome">{nome}</span>
              <button type="button" className="plt-icone-btn" aria-label="Fechar menu" onClick={() => setGaveta(false)}>
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="plt-gaveta-corpo">
              <details className="plt-acordeao">
                <summary>Recursos <ChevronDown aria-hidden="true" /></summary>
                <ul>
                  {recursos.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/recursos/${r.slug}`} className="plt-gaveta-link">
                        <Icone nome={r.icone} />
                        <span>{r.titulo}{r.status === "em-breve" ? <span className="plt-selo-breve">Em breve</span> : null}</span>
                      </Link>
                    </li>
                  ))}
                  <li><Link href="/recursos" className="plt-gaveta-link plt-gaveta-todos">Ver todos os recursos</Link></li>
                </ul>
              </details>
              <details className="plt-acordeao">
                <summary>Soluções <ChevronDown aria-hidden="true" /></summary>
                <ul>
                  {solucoes.map((s) => (
                    <li key={s.slug}><Link href={`/solucoes/${s.slug}`} className="plt-gaveta-link"><span>{s.titulo}</span></Link></li>
                  ))}
                  <li><Link href="/solucoes" className="plt-gaveta-link plt-gaveta-todos">Ver todas as situações</Link></li>
                </ul>
              </details>
              <Link href="/modelos" className="plt-gaveta-principal">Modelos de loja</Link>
              <Link href="/planos" className="plt-gaveta-principal">Preços</Link>
              <Link href="/entrar" className="plt-gaveta-principal">Entrar</Link>
            </div>
            <div className="plt-gaveta-pe">
              <Link href="/cadastro" className="plt-btn plt-btn-ambar plt-btn-bloco">Criar loja grátis</Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
