"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Globe, Loader2, Plus, RotateCw, Trash2, TriangleAlert } from "lucide-react";
import { cadastrarDominio, removerDominio, verificarDominioAgora } from "@/modules/domains/actions";
import type { TenantDomain } from "@/modules/domains/service";

/**
 * DOMÍNIO PRÓPRIO DA LOJA.
 *
 * O que esta tela deixa explícito, com todas as letras, para quem não é dev:
 *
 *  1. Cadastrar aqui NÃO coloca o domínio no ar sozinho -- é preciso configurar
 *     o DNS no painel do provedor onde o domínio foi comprado (Registro.br,
 *     GoDaddy, Hostgator etc.), seguindo a instrução mostrada.
 *  2. "Verificar agora" confere se o DNS já está apontando certo. Isso NÃO
 *     quer dizer que o domínio já está servindo a loja -- essa parte final
 *     depende de uma etapa que a plataforma ainda não tem pronta (por isso o
 *     texto nunca diz "ativo").
 */

const STATUS_VISUAL: Record<TenantDomain["status"], { icone: typeof Clock; cor: string; texto: string }> = {
  pendente: {
    icone: Clock,
    cor: "text-muted-foreground",
    texto: "Aguardando você configurar o DNS.",
  },
  verificando: {
    icone: Loader2,
    cor: "text-muted-foreground",
    texto: "Conferindo o DNS agora...",
  },
  verificado: {
    icone: CheckCircle2,
    cor: "text-emerald-600",
    texto:
      "DNS configurado certo. A ativação de verdade (o domínio passar a responder pela loja) ainda depende do domínio da plataforma estar pronto -- fale com o suporte para saber o andamento.",
  },
  erro: {
    icone: TriangleAlert,
    cor: "text-destructive",
    texto: "Erro ao verificar.",
  },
};

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return null;
  }
}

export function DomainConnectForm({ domains: initialDomains }: { domains: TenantDomain[] }) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [novoHost, setNovoHost] = useState("");
  const [mostrandoForm, setMostrandoForm] = useState(initialDomains.length === 0);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [verificandoId, setVerificandoId] = useState<string | null>(null);

  function aoCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await cadastrarDominio({ host: novoHost });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setNovoHost("");
      setMostrandoForm(false);
      router.refresh();
    });
  }

  function aoVerificar(id: string) {
    setErro(null);
    setVerificandoId(id);
    startTransition(async () => {
      const resultado = await verificarDominioAgora(id);
      setVerificandoId(null);
      if (!resultado.ok) {
        setErro(resultado.error);
      }
      router.refresh();
    });
  }

  function aoRemover(dominio: TenantDomain) {
    setErro(null);
    if (!confirm(`Remover o cadastro de "${dominio.host}"? Isso não afeta o registro de DNS que você já criou -- só o cadastro aqui na plataforma.`)) {
      return;
    }
    startTransition(async () => {
      const resultado = await removerDominio(dominio.id);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setDomains((atual) => atual.filter((d) => d.id !== dominio.id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="space-y-4">
        {domains.map((dominio) => {
          const visual = STATUS_VISUAL[dominio.status];
          const Icone = visual.icone;
          const instrucao = dominio.dnsInstructions;
          const ultimaChecagem = formatarData(dominio.lastCheckedAt);

          return (
            <div key={dominio.id} className="rounded-[10px] border border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Globe className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{dominio.host}</p>
                    <p className={`mt-1 flex items-start gap-1.5 text-xs ${visual.cor}`}>
                      <Icone className={`mt-0.5 size-3.5 shrink-0 ${dominio.status === "verificando" ? "animate-spin" : ""}`} />
                      <span>{dominio.status === "erro" && dominio.errorMessage ? dominio.errorMessage : visual.texto}</span>
                    </p>
                    {ultimaChecagem ? (
                      <p className="mt-1 text-xs text-muted-foreground">Última conferência: {ultimaChecagem}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => aoVerificar(dominio.id)}
                    disabled={pending}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40"
                  >
                    {pending && verificandoId === dominio.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="size-3.5" />
                    )}
                    Verificar agora
                  </button>
                  <button
                    type="button"
                    onClick={() => aoRemover(dominio)}
                    disabled={pending}
                    aria-label={`Remover ${dominio.host}`}
                    className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {instrucao ? (
                <div className="mt-3 rounded-[10px] bg-secondary/50 p-3 text-xs text-foreground">
                  <p className="font-medium">Como configurar o DNS</p>
                  <p className="mt-1 text-muted-foreground">{instrucao.texto}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd className="font-mono">{instrucao.tipo}</dd>
                    <dt className="text-muted-foreground">Nome</dt>
                    <dd className="font-mono">{instrucao.nome}</dd>
                    <dt className="text-muted-foreground">Valor</dt>
                    <dd className="font-mono">{instrucao.valorEsperado ?? "aguardando a plataforma"}</dd>
                  </dl>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {mostrandoForm ? (
        <form onSubmit={aoCadastrar} className="space-y-3 rounded-[10px] border border-dashed border-border p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Seu domínio</span>
            <input
              value={novoHost}
              onChange={(e) => setNovoHost(e.target.value)}
              placeholder="www.sualoja.com.br"
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              Digite exatamente como as pessoas vão acessar, por exemplo www.sualoja.com.br.
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending || !novoHost.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Cadastrar
            </button>
            {domains.length > 0 ? (
              <button
                type="button"
                onClick={() => setMostrandoForm(false)}
                className="flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setMostrandoForm(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Cadastrar outro domínio
        </button>
      )}
    </div>
  );
}
