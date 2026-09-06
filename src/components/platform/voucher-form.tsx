"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, Hourglass, Check, Copy } from "lucide-react";
import { createVoucher } from "@/modules/platform/vouchers-actions";

/**
 * Formulário de criação de cortesia.
 *
 * Os tipos das props são declarados AQUI, com campos simples, de propósito: os
 * tipos "de verdade" moram em vouchers-service.ts, que importa `server-only` e
 * não pode ser carregado pelo navegador.
 */
type ModuloOpcao = { slug: string; name: string; description: string | null; category: string; isCore: boolean };
type PlanoOpcao = { slug: string; name: string; isVisible: boolean };
type LojaOpcao = { id: string; nome: string; slug: string };

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const cardClass = "rounded-card border border-border bg-card p-5";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const neutralButton =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60";

/** Nome bonito de cada grupo de módulos, para não mostrar o código cru. */
const CATEGORIA_LABEL: Record<string, string> = {
  nucleo: "Núcleo (toda loja já tem)",
  operacao: "Operação do dia a dia",
  vendas: "Vendas",
  vitrine: "Vitrine e conteúdo",
  crescimento: "Crescimento",
  loja: "Outros",
};

/** Data de hoje em Brasília, no formato que o campo de data entende. */
function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function VoucherForm({
  modulos,
  planos,
  lojas,
}: {
  modulos: ModuloOpcao[];
  planos: PlanoOpcao[];
  lojas: LojaOpcao[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [codigo, setCodigo] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [planoSlug, setPlanoSlug] = useState("");
  const [modulosMarcados, setModulosMarcados] = useState<string[]>([]);
  const [diasDeAcesso, setDiasDeAcesso] = useState(30);
  const [prazoParaResgatar, setPrazoParaResgatar] = useState("");
  const [quantidadeDeUsos, setQuantidadeDeUsos] = useState(1);
  const [motivo, setMotivo] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [criado, setCriado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Módulos do núcleo já vêm com toda loja: marcar não faria diferença.
  const extras = modulos.filter((m) => !m.isCore);
  const categorias = [...new Set(extras.map((m) => m.category))];

  function alternarModulo(slug: string) {
    setModulosMarcados((atual) => (atual.includes(slug) ? atual.filter((s) => s !== slug) : [...atual, slug]));
  }

  async function copiarCodigo(valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setCriado(null);
    setCopiado(false);

    if (!motivo.trim()) {
      setErro("Escreva o motivo desta cortesia antes de continuar.");
      return;
    }

    startTransition(async () => {
      try {
        const resultado = await createVoucher({
          codigo,
          tenantId,
          planoSlug,
          modulos: modulosMarcados,
          diasDeAcesso,
          prazoParaResgatar,
          quantidadeDeUsos,
          motivo,
        });
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setCriado(resultado.codigo);
        setCodigo("");
        setMotivo("");
        setModulosMarcados([]);
        setPlanoSlug("");
        setTenantId("");
        router.refresh();
      } catch {
        setErro("A cortesia não pôde ser criada. Tente de novo em alguns segundos.");
      }
    });
  }

  return (
    <form onSubmit={enviar} className={cardClass}>
      <h2 className="font-display text-xl text-foreground">Gerar cortesia</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A cortesia é um código que você entrega a alguém. Quando essa pessoa resgatar o código, a loja dela ganha o
        acesso descrito abaixo <strong>sem pagar nada</strong>. Nenhuma cobrança é criada.
      </p>

      {/* Os dois prazos, explicados lado a lado. É o erro clássico: no Agentop
          os dois eram confundidos e a cortesia vencia antes de ser usada. */}
      <div className="mt-4 grid gap-3 rounded-[10px] bg-secondary/50 p-4 sm:grid-cols-2">
        <div className="flex gap-3">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Prazo para RESGATAR</p>
            <p className="mt-1 text-sm text-muted-foreground">
              É a data limite para a pessoa digitar o código. Depois dessa data o código não vale mais, mesmo que
              ninguém o tenha usado. Deixe vazio para o código não vencer nunca.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Hourglass className="mt-0.5 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tempo de acesso que o resgate dá</p>
            <p className="mt-1 text-sm text-muted-foreground">
              É por quantos dias a loja fica liberada, contados <strong>a partir do dia em que a pessoa resgatar</strong>
              . Não tem relação com a data acima.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Exemplo: prazo para resgatar 31/12 e 90 dias de acesso. Se a pessoa resgatar no dia 30/12, ela fica com a loja
          liberada até o fim de março — o prazo de resgate acabar não corta o acesso de quem já resgatou.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Código (opcional)</span>
          <input
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="Deixe vazio para gerar automaticamente"
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Se deixar vazio, o sistema cria um código fácil de ditar, no formato <strong>CESTA-4K9P</strong>. Se
            preencher, ele vira maiúsculas automaticamente.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Loja (opcional)</span>
          <select value={tenantId} onChange={(evento) => setTenantId(evento.target.value)} className={inputClass}>
            <option value="">Qualquer loja pode resgatar</option>
            {lojas.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome} (/{loja.slug})
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Escolhendo uma loja, só ela consegue resgatar este código. Deixando em branco, qualquer loja consegue.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Plano concedido</span>
          <select value={planoSlug} onChange={(evento) => setPlanoSlug(evento.target.value)} className={inputClass}>
            <option value="">Nenhum plano (só os módulos extras marcados abaixo)</option>
            {planos.map((plano) => (
              <option key={plano.slug} value={plano.slug}>
                {plano.name}
                {plano.isVisible ? "" : " · não aparece na vitrine"}
              </option>
            ))}
          </select>
          {planos.length === 0 ? (
            <span className="mt-1.5 block text-xs text-muted-foreground">
              Nenhum plano cadastrado ainda. Enquanto não houver planos, a cortesia só consegue conceder módulos extras.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Tempo de acesso que o resgate dá (dias)
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={diasDeAcesso}
            onChange={(evento) => setDiasDeAcesso(Number(evento.target.value))}
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            De 1 a 365 dias, contados a partir do dia do resgate.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Data limite para resgatar (opcional)</span>
          <input
            type="date"
            min={hojeEmBrasilia()}
            value={prazoParaResgatar}
            onChange={(evento) => setPrazoParaResgatar(evento.target.value)}
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Vale até o fim desse dia. Vazio = o código nunca vence.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Quantas vezes pode ser usado</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={quantidadeDeUsos}
            onChange={(evento) => setQuantidadeDeUsos(Number(evento.target.value))}
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            1 = código pessoal, some depois do primeiro resgate. Mais de 1 = o mesmo código serve para várias lojas.
          </span>
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-foreground">Módulos extras concedidos (opcional)</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque o que esta cortesia libera <strong>além</strong> do plano. Os módulos do núcleo (pedidos, produtos,
          configurações, pagamentos e painel de vendas) já vêm com toda loja e por isso não aparecem aqui.
        </p>
        <div className="mt-3 space-y-4">
          {categorias.map((categoria) => (
            <div key={categoria}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {CATEGORIA_LABEL[categoria] ?? categoria}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {extras
                  .filter((modulo) => modulo.category === categoria)
                  .map((modulo) => (
                    <label
                      key={modulo.slug}
                      className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border bg-background p-3"
                    >
                      <input
                        type="checkbox"
                        checked={modulosMarcados.includes(modulo.slug)}
                        onChange={() => alternarModulo(modulo.slug)}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{modulo.name}</span>
                        {modulo.description ? (
                          <span className="block text-xs text-muted-foreground">{modulo.description}</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Motivo / observação (obrigatório)</span>
        <input
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          placeholder="Exemplo: parceria de lançamento com a loja da Juliana"
          className={inputClass}
        />
        <span className="mt-1.5 block text-xs text-muted-foreground">
          É o que explica, daqui a seis meses, por que esta loja não pagou. Fica registrado junto com o seu nome.
        </span>
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Gerar cortesia
        </button>
        <span className="text-xs text-muted-foreground">Nenhuma cobrança é criada ao gerar uma cortesia.</span>
      </div>

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

      {criado ? (
        <div className="mt-4 rounded-[10px] border border-border bg-secondary/50 p-4">
          <p className="text-sm font-semibold text-green-700">Cortesia criada.</p>
          <p className="mt-1 text-sm text-muted-foreground">Entregue este código para quem vai resgatar:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-[10px] border border-border bg-card px-3 py-2 font-mono text-base font-semibold tracking-wider text-foreground">
              {criado}
            </code>
            <button type="button" onClick={() => copiarCodigo(criado)} className={neutralButton}>
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copiado ? "Copiado" : "Copiar código"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
