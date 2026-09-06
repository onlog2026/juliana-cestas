import Link from "next/link";
import { AlertTriangle, Boxes, Percent, PackageSearch } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { formatCents } from "@/lib/money";
import { addDaysToDateStr, saoPauloDateStr } from "@/lib/time/sao-paulo";
import { listarEstoque, listarMovimentos, resumirEstoque } from "@/modules/inventory/service";
import { MOVEMENT_LABELS } from "@/modules/inventory/movements";
import { StockManager } from "@/components/admin/stock-manager";
import { formatarDataBr } from "@/components/admin/purchase-list";

/**
 * Painel de estoque.
 *
 * Regra que atravessa a tela inteira: quando falta dado para uma conta, o
 * número é "—" e a frase abaixo explica o que falta. NUNCA zero. Zero é uma
 * afirmação ("não há valor parado"); "—" é a verdade ("ainda não dá para
 * saber"). Mostrar zero no lugar de "não sei" faz a lojista decidir em cima de
 * um número que ninguém calculou.
 */

function Cartao({
  titulo,
  valor,
  detalhe,
  iconName,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  iconName: "boxes" | "alerta" | "margem" | "sem-controle";
  alerta?: boolean;
}) {
  // Ícone escolhido por STRING aqui dentro, no servidor. Nunca passar o
  // componente do ícone entre servidor e cliente.
  const Icone =
    iconName === "boxes"
      ? Boxes
      : iconName === "alerta"
        ? AlertTriangle
        : iconName === "margem"
          ? Percent
          : PackageSearch;

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icone className={`size-4 ${alerta ? "text-destructive" : ""}`} /> {titulo}
      </div>
      <p className={`mt-2 font-display text-2xl ${alerta ? "text-destructive" : "text-foreground"}`}>{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

export default async function AdminEstoquePage(props: {
  searchParams: Promise<{ de?: string; ate?: string; produto?: string }>;
}) {
  const staff = await requireStaffWithModule("estoque");
  const params = await props.searchParams;

  const hoje = saoPauloDateStr();
  const de = params.de || addDaysToDateStr(hoje, -29);
  const ate = params.ate || hoje;
  const produtoFiltro = params.produto || "";

  const [linhas, movimentos] = await Promise.all([
    listarEstoque(staff.tenantId),
    listarMovimentos(staff.tenantId, { de, ate, productId: produtoFiltro || null }),
  ]);
  const resumo = resumirEstoque(linhas);

  const valorParadoTexto =
    resumo.valorParado.produtosContados === 0
      ? "—"
      : formatCents(resumo.valorParado.valorCents);
  const valorParadoDetalhe =
    resumo.valorParado.produtosContados === 0
      ? "Nenhuma cesta ativa tem custo E estoque cadastrados ao mesmo tempo. Registre uma compra para o sistema saber o custo."
      : resumo.valorParado.produtosIncompletos > 0
        ? `Soma de ${resumo.valorParado.produtosContados} cesta(s). Faltam ${resumo.valorParado.produtosIncompletos} sem custo ou sem estoque — o valor real é maior.`
        : `Custo × saldo de todas as ${resumo.valorParado.produtosContados} cestas ativas.`;

  const margemTexto = resumo.margem.percentual === null ? "—" : `${resumo.margem.percentual.toFixed(1)}%`;
  const margemDetalhe =
    resumo.margem.percentual === null
      ? "Nenhuma cesta ativa tem custo cadastrado, então não dá para calcular margem."
      : resumo.margem.produtosSemCusto > 0
        ? `Média de ${resumo.margem.produtosContados} cesta(s). ${resumo.margem.produtosSemCusto} ficaram de fora por não ter custo.`
        : `Média de (preço − custo) ÷ preço das ${resumo.margem.produtosContados} cestas ativas.`;

  const produtosOrdenados = [...linhas].sort((a, b) => {
    if (a.abaixoDoMinimo !== b.abaixoDoMinimo) return a.abaixoDoMinimo ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-display text-2xl text-foreground">Estoque</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        O saldo nunca é digitado direto: ele é o resultado dos lançamentos abaixo. Toda entrada, saída, ajuste
        e perda fica no histórico, com o saldo que ficou depois.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          titulo="Valor parado em estoque"
          valor={valorParadoTexto}
          detalhe={valorParadoDetalhe}
          iconName="boxes"
        />
        <Cartao
          titulo="Abaixo do mínimo"
          valor={String(resumo.produtosAbaixoDoMinimo)}
          detalhe={
            resumo.produtosAbaixoDoMinimo > 0
              ? "Cestas que chegaram no estoque mínimo ou abaixo dele. Repor antes de vender."
              : "Nenhuma cesta ativa abaixo do mínimo cadastrado."
          }
          iconName="alerta"
          alerta={resumo.produtosAbaixoDoMinimo > 0}
        />
        <Cartao titulo="Margem média" valor={margemTexto} detalhe={margemDetalhe} iconName="margem" />
        <Cartao
          titulo="Sem controle de estoque"
          valor={String(resumo.produtosSemControle)}
          detalhe="Cestas marcadas como ilimitadas (sob encomenda). Elas não entram nas contas acima."
          iconName="sem-controle"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Cestas e lançamentos</h2>
        <div className="mt-3">
          <StockManager produtos={produtosOrdenados} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Histórico de movimentações</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Lançamento nunca é apagado. Se algo foi lançado errado, o certo é gravar um ajuste explicando — a
          linha errada continua visível, e é isso que permite entender o que aconteceu depois.
        </p>

        <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">De</span>
            <input
              type="date"
              name="de"
              defaultValue={de}
              className="h-11 rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">Até</span>
            <input
              type="date"
              name="ate"
              defaultValue={ate}
              className="h-11 rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground"
            />
          </label>
          <label className="block min-w-[200px]">
            <span className="mb-1.5 block text-xs font-medium text-foreground">Cesta</span>
            <select
              name="produto"
              defaultValue={produtoFiltro}
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground"
            >
              <option value="">Todas</option>
              {linhas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-11 rounded-[10px] border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            Filtrar
          </button>
        </form>

        {movimentos.length === 0 ? (
          <p className="mt-4 rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">
            Nenhuma movimentação nesse período.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Cesta</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo depois</th>
                  <th className="px-4 py-3 font-medium">Motivo / origem</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatarDataBr(m.createdAt.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3 text-foreground">{m.productName}</td>
                    <td className="px-4 py-3 text-foreground">{MOVEMENT_LABELS[m.kind]}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {m.kind === "ajuste" ? `contou ${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{m.balanceAfter}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.referenceType === "compra" && m.referenceId ? (
                        <Link href={`/admin/compras/${m.referenceId}`} className="text-primary hover:underline">
                          Compra registrada
                        </Link>
                      ) : (
                        (m.reason ?? "—")
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
