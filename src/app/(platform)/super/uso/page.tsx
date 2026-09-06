import Link from "next/link";
import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listTenants } from "@/modules/platform/service";
import {
  listTenantUsage,
  ordenarUso,
  ehColunaOrdenavel,
  type ColunaOrdenavel,
  type UsoDaLoja,
  type Contagem,
} from "@/modules/platform/usage-service";
import { TenantStatusBadge, StorefrontSuspendedBadge } from "@/components/platform/tenant-status-badge";

export const dynamic = "force-dynamic";

/** "—" quando a leitura falhou; o número quando deu certo (inclusive 0). */
function mostrarContagem(valor: Contagem): string {
  return valor === null ? "—" : String(valor);
}

const COLUNAS: { chave: ColunaOrdenavel; titulo: string; numerica: boolean }[] = [
  { chave: "nome", titulo: "Loja", numerica: false },
  { chave: "plano", titulo: "Plano", numerica: false },
  { chave: "situacao", titulo: "Situação", numerica: false },
  { chave: "produtos", titulo: "Produtos", numerica: true },
  { chave: "pedidos", titulo: "Pedidos", numerica: true },
  { chave: "pedidos30d", titulo: "Pedidos (30 dias)", numerica: true },
  { chave: "clientes", titulo: "Clientes", numerica: true },
  { chave: "banners", titulo: "Banners", numerica: true },
];

/**
 * Cabeçalho clicável. A ordenação viaja pela URL (`?ordenar=produtos&dir=asc`)
 * em vez de JavaScript no navegador: funciona sem hidratar nada, dá para
 * copiar o link já ordenado e não precisa transformar a tabela em componente
 * client só por causa de um clique.
 */
function CabecalhoOrdenavel({
  coluna,
  titulo,
  numerica,
  ordenarAtual,
  direcaoAtual,
}: {
  coluna: ColunaOrdenavel;
  titulo: string;
  numerica: boolean;
  ordenarAtual: ColunaOrdenavel;
  direcaoAtual: "asc" | "desc";
}) {
  const estaAtiva = ordenarAtual === coluna;
  // Clicar na coluna ativa inverte; clicar numa nova começa pelo mais útil:
  // maior primeiro nos números, A→Z nos textos.
  const proximaDirecao = estaAtiva ? (direcaoAtual === "asc" ? "desc" : "asc") : numerica ? "desc" : "asc";

  return (
    <th className={`py-2 pr-3 font-medium ${numerica ? "text-right" : "text-left"}`}>
      <Link
        href={`/super/uso?ordenar=${coluna}&dir=${proximaDirecao}`}
        className={`inline-flex items-center gap-1 hover:underline ${
          estaAtiva ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {titulo}
        {estaAtiva ? (
          direcaoAtual === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : null}
      </Link>
    </th>
  );
}

export default async function SuperUsoPage(props: {
  searchParams: Promise<{ ordenar?: string; dir?: string }>;
}) {
  // O layout já protege a rota, mas esta tela lê o volume de operação de todas
  // as lojas: confirma de novo por conta própria.
  await requireSuperAdmin();

  const { ordenar: ordenarParam, dir: dirParam } = await props.searchParams;
  const ordenar: ColunaOrdenavel = ehColunaOrdenavel(ordenarParam) ? ordenarParam : "pedidos30d";
  const direcao: "asc" | "desc" = dirParam === "asc" ? "asc" : "desc";

  let linhas: UsoDaLoja[] = [];
  let mensagemDeErro: string | null = null;

  try {
    const lojas = await listTenants();
    linhas = ordenarUso(await listTenantUsage(lojas), ordenar, direcao);
  } catch (e) {
    mensagemDeErro = e instanceof Error ? e.message : "Não foi possível carregar as lojas.";
  }

  const erro = mensagemDeErro;
  const lojasComFalha = linhas.filter((l) => l.temFalhaDeLeitura).length;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-foreground">Uso por loja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O tamanho real da operação de cada loja. Serve para dois lados: quem cresceu e pode subir de plano, e
          quem paga e não está usando. Clique no título de qualquer coluna para reordenar a tabela.
        </p>
      </div>

      {erro ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar a lista de lojas
          </div>
          <p className="mt-2 text-sm text-foreground">{erro}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A tabela não aparece porque o banco de dados não respondeu — não é porque não existe nenhuma loja.
            Recarregue a página; se continuar assim, o banco está fora do ar.
          </p>
        </div>
      ) : null}

      {!erro && lojasComFalha > 0 ? (
        <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert className="size-4" /> Algumas contagens não puderam ser lidas
          </div>
          <p className="mt-2 text-sm text-amber-900">
            {lojasComFalha === 1
              ? "1 loja está com pelo menos uma contagem indisponível."
              : `${lojasComFalha} lojas estão com pelo menos uma contagem indisponível.`}{" "}
            Onde aparece <strong>“—”</strong> na tabela, o sistema <strong>não conseguiu ler</strong> aquele
            número. Isso é diferente de zero: zero significa que a loja realmente não tem nada ali. Recarregue a
            página; se o traço continuar no mesmo lugar, o banco recusou aquela consulta.
          </p>
        </div>
      ) : null}

      {!erro ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {linhas.length === 1 ? "1 loja na plataforma" : `${linhas.length} lojas na plataforma`}
          </p>

          {linhas.length === 0 ? (
            <div className="mt-4 rounded-card border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Ainda não existe nenhuma loja cadastrada na plataforma. Assim que a primeira loja for criada,
                ela aparece aqui.
              </p>
            </div>
          ) : (
            // A tabela é larga: ela rola sozinha na horizontal dentro da caixa,
            // e a página nunca rola de lado no celular.
            <div className="mt-4 overflow-x-auto rounded-card border border-border bg-card">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase">
                    {COLUNAS.map((coluna) => (
                      <CabecalhoOrdenavel
                        key={coluna.chave}
                        coluna={coluna.chave}
                        titulo={coluna.titulo}
                        numerica={coluna.numerica}
                        ordenarAtual={ordenar}
                        direcaoAtual={direcao}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {linhas.map((linha) => (
                    <tr key={linha.tenantId} className="align-top">
                      <td className="py-3 pr-3 pl-4">
                        <Link
                          href={`/super/lojas/${linha.tenantId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {linha.nome}
                        </Link>
                        <span className="block text-xs text-muted-foreground">/{linha.slug}</span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {linha.plano ?? "Sem plano cadastrado"}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex flex-wrap gap-1">
                          <TenantStatusBadge status={linha.subscriptionStatus} />
                          {linha.vitrineSuspensa ? <StorefrontSuspendedBadge /> : null}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground">
                        {mostrarContagem(linha.produtos)}
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground">
                        {mostrarContagem(linha.pedidos)}
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground">
                        {mostrarContagem(linha.pedidos30d)}
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground">
                        {mostrarContagem(linha.clientes)}
                      </td>
                      <td className="py-3 pr-4 text-right text-foreground">
                        {mostrarContagem(linha.banners)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            “Pedidos (30 dias)” conta os pedidos criados nos últimos 30 dias, independentemente de terem sido
            pagos. Um traço “—” quer dizer que o sistema não conseguiu ler aquele número, nunca que ele é zero.
          </p>
        </>
      ) : null}
    </div>
  );
}
