import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  listAppErrors,
  listarLojasComErro,
  getDestaqueCritico,
  type AppErrorItem,
  type ErrorLevel,
  type PeriodoFiltro,
} from "@/modules/platform/errors-service";
import { ErrorList, type ErrorListItem } from "@/components/platform/error-list";

export const dynamic = "force-dynamic";

/**
 * Erros & Alertas — o painel que evita a plataforma ficar cega.
 *
 * O bloco vermelho do topo é o equivalente ao "FALHA EM 3 INTEGRAÇÕES" do
 * Agentop: quem abre o painel tem que bater o olho e saber, sem clicar em
 * nada, se tem coisa quebrada agora.
 *
 * Datas são formatadas AQUI (no servidor) e viajam prontas para o componente
 * de lista: assim não existe diferença entre o que o servidor desenhou e o que
 * o navegador desenha (o famoso erro de hidratação do React).
 */

const NIVEIS: { value: "" | ErrorLevel; label: string }[] = [
  { value: "", label: "Todos os níveis" },
  { value: "warning", label: "Aviso" },
  { value: "error", label: "Erro" },
  { value: "critical", label: "Crítico" },
];

const PERIODOS: { value: PeriodoFiltro; label: string }[] = [
  { value: "24h", label: "Últimas 24 horas" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const horaFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "hoje às 14:32", "ontem às 09:05" ou "02/09/2026 às 18:40", no relógio de Brasília. */
function formatarQuando(iso: string | null): string {
  if (!iso) return "data desconhecida";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "data desconhecida";
  const agora = Date.now();
  const dia = dataFormatter.format(d);
  const hora = horaFormatter.format(d);
  if (dia === dataFormatter.format(new Date(agora))) return `hoje às ${hora}`;
  if (dia === dataFormatter.format(new Date(agora - 86400000))) return `ontem às ${hora}`;
  return `${dia} às ${hora}`;
}

function paraLista(item: AppErrorItem): ErrorListItem {
  return {
    id: item.id,
    quando: formatarQuando(item.createdAt),
    lojaNome: item.tenantName,
    modulo: item.module,
    acao: item.action,
    nivel: item.level,
    mensagem: item.message,
    detalhe: item.detail,
    impacto: item.impacto,
    dispensadoEm: item.dismissedAt ? formatarQuando(item.dismissedAt) : null,
    dispensadoPor: item.dismissedBy,
  };
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function SuperErrosPage(props: {
  searchParams: Promise<{ nivel?: string; loja?: string; periodo?: string; dispensados?: string }>;
}) {
  await requireSuperAdmin();

  const params = await props.searchParams;

  // Parâmetro que não estiver na lista conhecida é ignorado (volta ao padrão),
  // nunca vai direto para a consulta.
  const nivel = (NIVEIS.some((n) => n.value === (params.nivel ?? "")) ? (params.nivel ?? "") : "") as "" | ErrorLevel;
  const periodo = (PERIODOS.some((p) => p.value === params.periodo) ? params.periodo : "7d") as PeriodoFiltro;
  const incluirDispensados = params.dispensados === "1";
  const lojaParam = (params.loja ?? "").trim();

  const lojas = await listarLojasComErro();
  const loja = lojas.some((l) => l.id === lojaParam) ? lojaParam : "";

  const destaque = await getDestaqueCritico();
  const { itens, dispensaDisponivel, dispensados } = await listAppErrors({
    nivel,
    tenantId: loja || undefined,
    periodo,
    incluirDispensados,
  });

  const rotuloPeriodo = PERIODOS.find((p) => p.value === periodo)?.label ?? "Últimos 7 dias";
  const temFiltro = Boolean(nivel || loja || incluirDispensados || periodo !== "7d");

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-foreground">Erros e alertas</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Tudo o que deu errado dentro da plataforma: falha de pagamento, e-mail que não saiu, pedido que não gravou.
        Cada linha diz em qual loja aconteceu e, quando dá para saber, o que o cliente daquela loja percebeu. Nada aqui
        é apagado: dispensar um alerta só o tira da lista do dia a dia.
      </p>

      {/* ── Painel de destaque: o alarme ─────────────────────────────────── */}
      {destaque.total > 0 ? (
        <section className="mt-6 rounded-card border-2 border-red-600 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-6 shrink-0 text-red-700" />
            <div className="min-w-0">
              <h2 className="font-display text-xl text-red-900">
                {destaque.total === 1
                  ? "1 erro crítico nas últimas 24 horas"
                  : `${destaque.total} erros críticos nas últimas 24 horas`}
              </h2>
              <p className="mt-1 text-sm text-red-900">
                Erro crítico é o que costuma travar dinheiro ou pedido. Vale olhar agora, antes de qualquer outra coisa
                do painel.
              </p>

              <ul className="mt-3 space-y-2">
                {destaque.recentes.map((item) => (
                  <li key={item.id} className="rounded-[10px] bg-card p-3">
                    <p className="text-xs text-muted-foreground">
                      {formatarQuando(item.createdAt)} · {item.tenantName ?? "Plataforma"} · módulo {item.module}
                    </p>
                    <p className="mt-1 font-medium break-words text-foreground">{item.message}</p>
                    {item.impacto ? <p className="mt-1 text-sm text-red-800">{item.impacto}</p> : null}
                  </li>
                ))}
              </ul>

              {destaque.total > destaque.recentes.length ? (
                <Link
                  href="/super/erros?nivel=critical&periodo=24h"
                  className="mt-3 inline-block text-sm font-semibold text-red-900 underline"
                >
                  Ver os {destaque.total} erros críticos
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : destaque.totalGeral === 0 ? (
        <section className="mt-6 rounded-card border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-700" />
            <div>
              <h2 className="font-display text-xl text-foreground">Nenhum erro registrado nas últimas 24 horas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nada quebrou hoje até agora. Se um pagamento falhar, um e-mail não sair ou um pedido não gravar, o
                alerta aparece aqui em cima automaticamente, em vermelho.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-card border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-6 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-display text-xl text-foreground">Nenhum erro crítico nas últimas 24 horas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Existem{" "}
                {destaque.totalGeral === 1
                  ? "1 registro de aviso ou erro comum"
                  : `${destaque.totalGeral} registros de aviso ou erro comum`}{" "}
                nas últimas 24 horas, mas nenhum do tipo que trava dinheiro ou pedido. Estão na lista abaixo.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Fachada não: se a coluna de dispensa não existe, a tela diz isso. */}
      {!dispensaDisponivel ? (
        <p className="mt-4 rounded-[10px] bg-amber-100 px-3 py-2 text-sm text-amber-900">
          O botão &ldquo;Dispensar&rdquo; não aparece porque falta rodar no banco a migração{" "}
          <strong>0027_app_errors_dismissed.sql</strong>. A lista de erros funciona normalmente; só não dá para marcar
          um alerta como visto ainda.
        </p>
      ) : null}

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <form method="get" className="mt-6 grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nível</span>
          <select name="nivel" defaultValue={nivel} className={inputClass}>
            {NIVEIS.map((n) => (
              <option key={n.value || "todos"} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Loja</span>
          <select name="loja" defaultValue={loja} className={inputClass}>
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Período</span>
          <select name="periodo" defaultValue={periodo} className={inputClass}>
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          {dispensaDisponivel ? (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="dispensados"
                value="1"
                defaultChecked={incluirDispensados}
                className="size-4 rounded border-border"
              />
              Mostrar também os alertas já dispensados
            </label>
          ) : null}
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Filtrar
          </button>
          {temFiltro ? (
            <Link href="/super/erros" className="text-sm font-medium text-primary hover:underline">
              Limpar filtros
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {itens.length === 1 ? "1 registro encontrado" : `${itens.length} registros encontrados`} · {rotuloPeriodo}
        {incluirDispensados && dispensados > 0
          ? ` · incluindo ${dispensados === 1 ? "1 já dispensado" : `${dispensados} já dispensados`}`
          : ""}
      </p>

      {/* ── Lista ────────────────────────────────────────────────────────── */}
      {itens.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-card p-6">
          {temFiltro ? (
            <p className="text-sm text-muted-foreground">
              Nenhum erro bate com esse filtro. Isso é uma boa notícia, mas confira se o período não está curto demais —{" "}
              <Link href="/super/erros?periodo=30d" className="font-medium text-primary hover:underline">
                ver os últimos 30 dias
              </Link>{" "}
              ou{" "}
              <Link href="/super/erros" className="font-medium text-primary hover:underline">
                limpar os filtros
              </Link>
              .
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum erro registrado nos últimos 7 dias. Quando alguma coisa falhar na plataforma — um pagamento que
              não confirmou, um e-mail que não saiu, uma foto que não subiu — o registro aparece aqui
              automaticamente, com a loja afetada e o que o cliente percebeu.
            </p>
          )}
        </div>
      ) : (
        <ErrorList itens={itens.map(paraLista)} dispensaDisponivel={dispensaDisponivel} />
      )}
    </div>
  );
}
