import Link from "next/link";
import type { ItemRecurso, ItemSolucao } from "./cabecalho";

/**
 * Rodapé da plataforma. Só links para páginas que existem; nada de contato, selo ou número
 * que o dono não tenha confirmado.
 */
export function Rodape({ nome, recursos, solucoes }: { nome: string; recursos: ItemRecurso[]; solucoes: ItemSolucao[] }) {
  const ano = new Date().getFullYear();
  return (
    <footer className="plt-rodape">
      <div className="plt-wrap">
        <div className="plt-rodape-grade">
          <div className="plt-rodape-marca">
            <p className="plt-rodape-nome">{nome}</p>
            <p className="plt-rodape-texto">
              Loja virtual para quem vende cestas e presentes: vitrine, carrinho, entrega com data marcada e
              pagamento, num lugar só.
            </p>
            <Link href="/cadastro" className="plt-btn plt-btn-ambar">Criar loja grátis</Link>
          </div>

          <nav aria-label="Plataforma">
            <h2 className="plt-rodape-titulo">Plataforma</h2>
            <ul>
              <li><Link href="/inicio">Início</Link></li>
              <li><Link href="/recursos">Recursos</Link></li>
              <li><Link href="/modelos">Modelos de loja</Link></li>
              <li><Link href="/planos">Preços</Link></li>
              <li><Link href="/entrar">Entrar</Link></li>
              <li><Link href="/cadastro">Criar loja grátis</Link></li>
            </ul>
          </nav>

          <nav aria-label="Recursos">
            <h2 className="plt-rodape-titulo">Recursos</h2>
            <ul>
              {recursos.slice(0, 7).map((r) => (
                <li key={r.slug}><Link href={`/recursos/${r.slug}`}>{r.titulo}</Link></li>
              ))}
              <li><Link href="/recursos" className="plt-rodape-mais">Ver todos</Link></li>
            </ul>
          </nav>

          <nav aria-label="Soluções">
            <h2 className="plt-rodape-titulo">Soluções</h2>
            <ul>
              {solucoes.map((s) => (
                <li key={s.slug}><Link href={`/solucoes/${s.slug}`}>{s.titulo}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="plt-rodape-base">
          <p>© {ano} {nome}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
