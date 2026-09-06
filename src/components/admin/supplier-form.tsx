"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { salvarFornecedor } from "@/modules/purchases/actions";
import type { Fornecedor } from "@/modules/purchases/service";

function Formulario({
  fornecedor,
  onPronto,
  onCancelar,
}: {
  fornecedor?: Fornecedor;
  onPronto: () => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(fornecedor?.name ?? "");
  const [telefone, setTelefone] = useState(fornecedor?.phone ?? "");
  const [email, setEmail] = useState(fornecedor?.email ?? "");
  const [observacoes, setObservacoes] = useState(fornecedor?.notes ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const resultado = await salvarFornecedor({
        id: fornecedor?.id,
        name: nome,
        phone: telefone,
        email,
        notes: observacoes,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      onPronto();
    });
  }

  const campo =
    "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-[10px] border border-border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nome do fornecedor</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Empório do Café" className={campo} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Telefone (opcional)</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            inputMode="tel"
            placeholder="(61) 90000-0000"
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail (opcional)</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            placeholder="contato@fornecedor.com.br"
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Observações (opcional)</span>
          <input
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Entrega às terças"
            className={campo}
          />
        </label>
      </div>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar fornecedor
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function SupplierForm({ fornecedores }: { fornecedores: Fornecedor[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  function concluir() {
    setEditando(null);
    setCriando(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {fornecedores.map((fornecedor) =>
        editando === fornecedor.id ? (
          <Formulario
            key={fornecedor.id}
            fornecedor={fornecedor}
            onPronto={concluir}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div
            key={fornecedor.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{fornecedor.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[fornecedor.phone, fornecedor.email, fornecedor.notes].filter(Boolean).join(" · ") ||
                  "Sem contato cadastrado"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditando(fornecedor.id)}
              aria-label={`Editar ${fornecedor.name}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <Pencil className="size-4" />
            </button>
          </div>
        )
      )}

      {criando ? (
        <Formulario onPronto={concluir} onCancelar={() => setCriando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Novo fornecedor
        </button>
      )}
    </div>
  );
}
