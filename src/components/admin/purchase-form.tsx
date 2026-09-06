"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/money";
import { registrarCompra, type ItemCompraInput } from "@/modules/purchases/actions";
import type { Fornecedor } from "@/modules/purchases/service";

/**
 * Cadastro de uma compra com vários itens.
 *
 * O total que aparece aqui é SÓ CONFERÊNCIA. Quem soma de verdade é o servidor,
 * a partir dos itens — o número desta tela nem é enviado. Total digitado (ou
 * calculado só no navegador) é o caminho mais curto para o financeiro não bater
 * com o estoque.
 */

export type ProdutoOpcao = { id: string; name: string };

type LinhaRascunho = {
  chave: string;
  productId: string; // "" = insumo avulso, que não movimenta estoque
  description: string;
  quantidade: string;
  custo: string; // reais, como a lojista digita
};

function novaLinha(): LinhaRascunho {
  return {
    chave: Math.random().toString(36).slice(2),
    productId: "",
    description: "",
    quantidade: "1",
    custo: "",
  };
}

function reaisParaCentavos(bruto: string): number {
  const limpo = bruto.trim().replace(/\./g, "").replace(",", ".");
  if (!limpo) return 0;
  const valor = Number.parseFloat(limpo);
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

function paraNumero(bruto: string): number {
  const limpo = bruto.trim().replace(",", ".");
  const valor = Number.parseFloat(limpo);
  return Number.isFinite(valor) ? valor : 0;
}

export function PurchaseForm({
  fornecedores,
  produtos,
  hoje,
}: {
  fornecedores: Fornecedor[];
  produtos: ProdutoOpcao[];
  /** "YYYY-MM-DD" de hoje no calendário de Brasília, calculado no servidor. */
  hoje: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");
  const [data, setData] = useState(hoje);
  const [nota, setNota] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [linhas, setLinhas] = useState<LinhaRascunho[]>([novaLinha()]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const campo =
    "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const totalPrevistoCents = linhas.reduce(
    (soma, linha) => soma + Math.round(paraNumero(linha.quantidade) * reaisParaCentavos(linha.custo)),
    0
  );

  function alterar(chave: string, campoAlvo: keyof LinhaRascunho, valor: string) {
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.chave === chave ? { ...linha, [campoAlvo]: valor } : linha))
    );
  }

  function limpar() {
    setFornecedorId("");
    setData(hoje);
    setNota("");
    setObservacoes("");
    setLinhas([novaLinha()]);
    setErro(null);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const itens: ItemCompraInput[] = linhas.map((linha) => {
      const produto = produtos.find((p) => p.id === linha.productId);
      return {
        productId: linha.productId || null,
        description: linha.description.trim() || produto?.name || "",
        quantity: paraNumero(linha.quantidade),
        unitCostCents: reaisParaCentavos(linha.custo),
      };
    });

    iniciar(async () => {
      const resultado = await registrarCompra({
        supplierId: fornecedorId || null,
        purchasedAt: data,
        invoiceNumber: nota,
        notes: observacoes,
        itens,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      limpar();
      setAberto(false);
      router.refresh();
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
      >
        <Plus className="size-4" /> Registrar nova compra
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-card border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Fornecedor</span>
          <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={campo}>
            <option value="">Sem fornecedor cadastrado</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Data da compra</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Número da nota (opcional)</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="12345" className={campo} />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">O que foi comprado</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha a cesta quando o item entrar no estoque de um produto do catálogo. Para embalagem, fita ou
          cartão, deixe em &quot;Insumo avulso&quot;: entra na despesa, mas não mexe no estoque de cesta nenhuma.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Cesta do catálogo</th>
                <th className="py-2 pr-3 font-medium">Descrição</th>
                <th className="py-2 pr-3 font-medium">Quantidade</th>
                <th className="py-2 pr-3 font-medium">Custo por unidade (R$)</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.chave} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3">
                    <select
                      value={linha.productId}
                      onChange={(e) => alterar(linha.chave, "productId", e.target.value)}
                      className={campo}
                    >
                      <option value="">Insumo avulso (não mexe no estoque)</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={linha.description}
                      onChange={(e) => alterar(linha.chave, "description", e.target.value)}
                      placeholder="Café em grãos 500g"
                      className={campo}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={linha.quantidade}
                      onChange={(e) => alterar(linha.chave, "quantidade", e.target.value)}
                      inputMode="decimal"
                      className={campo}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={linha.custo}
                      onChange={(e) => alterar(linha.chave, "custo", e.target.value)}
                      inputMode="decimal"
                      placeholder="0,00"
                      className={campo}
                    />
                  </td>
                  <td className="py-2 pr-3 text-right text-muted-foreground">
                    {formatCents(Math.round(paraNumero(linha.quantidade) * reaisParaCentavos(linha.custo)))}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setLinhas((atuais) => atuais.filter((l) => l.chave !== linha.chave))}
                      disabled={linhas.length === 1}
                      aria-label="Remover item"
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => setLinhas((atuais) => [...atuais, novaLinha()])}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Adicionar item
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Observações (opcional)</span>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Pago no PIX, entrega na segunda"
          className={campo}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-secondary p-3">
        <span className="text-sm text-foreground">Total desta compra (conferência)</span>
        <span className="font-display text-lg text-foreground">{formatCents(totalPrevistoCents)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        O valor gravado é sempre a soma dos itens, refeita no servidor. Se este número não bater com a sua
        nota, o erro está em alguma linha acima.
      </p>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : null}
          Gravar compra
        </button>
        <button
          type="button"
          onClick={() => {
            limpar();
            setAberto(false);
          }}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
