import { CalendarClock, CircleAlert, Lock } from "lucide-react";
import type { AccountState } from "@/modules/entitlements/resolve";

/**
 * O aviso do topo do painel sobre a situação da assinatura.
 *
 * Este é um componente de SERVIDOR e recebe só dados simples (texto e número).
 * Nenhum ícone, nenhuma função, nenhum objeto do banco atravessa fronteira
 * nenhuma -- os ícones são resolvidos aqui dentro, onde já estão importados.
 *
 * Regras de escrita, porque quem lê não é dev:
 *  - frase completa, em português, sem sigla e sem jargão;
 *  - diz o que ESTÁ acontecendo, o que VAI acontecer e o que fazer;
 *  - nunca aparece quando está tudo em dia (nem para a loja fundadora).
 *
 * Sem cor nova: usa os tokens que a loja já tem (`border`, `card`, `primary`,
 * `destructive`, `muted-foreground`).
 */
export function PlanBanner({
  state,
  diasRestantes,
  planName,
}: {
  state: AccountState;
  /** Dias inteiros até o fim do teste. `null` quando não há teste rodando. */
  diasRestantes: number | null;
  /** Nome do plano, se conhecido. Só entra no texto quando existe. */
  planName: string | null;
}) {
  // Tudo em dia (inclusive a loja fundadora): nenhum aviso. O painel de quem
  // não tem problema nenhum não deve ganhar tarja nenhuma.
  if (state === "ok") return null;

  const plano = planName ? ` do plano ${planName}` : "";

  if (state === "teste") {
    const dias = diasRestantes ?? 0;
    const prazo =
      dias <= 0
        ? "Seu teste grátis termina hoje."
        : dias === 1
          ? "Seu teste grátis termina amanhã."
          : `Seu teste grátis termina em ${dias} dias.`;

    return (
      <Tarja tom="neutro" icone="relogio" titulo={prazo}>
        Quando o teste terminar, as telas que não fazem parte do seu plano somem do menu e a loja continua
        funcionando normalmente para os seus clientes. Para não perder nada, abra a página de assinatura e
        escolha um plano antes dessa data.
      </Tarja>
    );
  }

  if (state === "atrasado") {
    return (
      <Tarja tom="alerta" icone="alerta" titulo="Ainda não confirmamos o pagamento da sua assinatura.">
        Seu acesso continua liberado por enquanto. Se o pagamento{plano} já foi feito, pode levar alguns minutos
        para ser confirmado. Se ainda não foi, abra a página de assinatura e faça o pagamento para não perder o
        acesso às telas do seu plano.
      </Tarja>
    );
  }

  if (state === "teste_vencido") {
    return (
      <Tarja tom="alerta" icone="cadeado" titulo="Seu teste grátis terminou.">
        Por enquanto ficam abertas as configurações da loja e a página de assinatura. As outras telas voltam ao
        menu assim que você escolher um plano. Nada do que você cadastrou foi apagado, e sua loja continua no ar
        para os seus clientes.
      </Tarja>
    );
  }

  // state === "bloqueado"
  return (
    <Tarja tom="alerta" icone="cadeado" titulo="Sua assinatura está cancelada.">
      Por enquanto ficam abertas as configurações da loja e a página de assinatura. Para voltar a usar os
      recursos{plano}, abra a página de assinatura e reative seu plano. Nada do que você cadastrou foi apagado.
    </Tarja>
  );
}

/**
 * A tarja em si. `icone` viaja como TEXTO e o componente resolve qual desenhar
 * -- o mesmo cuidado que existe no menu do celular: nunca passar a função do
 * ícone adiante.
 */
function Tarja({
  tom,
  icone,
  titulo,
  children,
}: {
  tom: "neutro" | "alerta";
  icone: "relogio" | "alerta" | "cadeado";
  titulo: string;
  children: React.ReactNode;
}) {
  const Icone = icone === "relogio" ? CalendarClock : icone === "alerta" ? CircleAlert : Lock;
  const borda = tom === "alerta" ? "border-destructive/40" : "border-border";
  const corIcone = tom === "alerta" ? "text-destructive" : "text-primary";

  return (
    <div className={`mb-6 rounded-card border ${borda} bg-card p-4`} role="status">
      <div className="flex items-start gap-3">
        <Icone className={`mt-0.5 size-5 shrink-0 ${corIcone}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{titulo}</p>
          <p className="mt-1 text-sm text-muted-foreground">{children}</p>
        </div>
      </div>
    </div>
  );
}
