import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";

/**
 * Leitura da configuração da plataforma (`saas_config`, linha única id = 1) e
 * do painel de saúde do ambiente.
 *
 * A tabela nasceu com RLS `using(false)`: o navegador não lê nem escreve nela.
 * Tudo passa por aqui.
 */

export type PlatformConfig = {
  platformName: string;
  supportEmail: string | null;
  /** Dias de teste grátis para loja nova. */
  trialDays: number;
  /**
   * `null` = no teste a loja vê TUDO (padrão).
   * Lista = no teste a loja vê SÓ esses módulos.
   * A diferença entre "null" e "lista vazia" é intencional e importante.
   */
  trialModuleSlugs: string[] | null;
  /** Dias de atraso antes de a vitrine sair do ar. */
  storefrontGraceDays: number;
  updatedAt: string | null;
  updatedBy: string | null;
  /**
   * A linha id=1 existe mesmo no banco?
   * Se for `false`, o que está na tela são os padrões do sistema e nada foi
   * lido do banco -- a tela precisa DIZER isso em vez de fingir que leu.
   */
  linhaExiste: boolean;
};

const PADROES: Omit<PlatformConfig, "linhaExiste"> = {
  platformName: "Plataforma",
  supportEmail: null,
  trialDays: 2,
  trialModuleSlugs: null,
  storefrontGraceDays: 7,
  updatedAt: null,
  updatedBy: null,
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("saas_config")
    .select("platform_name, support_email, trial_days, trial_module_slugs, storefront_grace_days, updated_at, updated_by")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    // Erro de leitura NUNCA vira "configuração padrão" silenciosa: se a tela
    // mostrasse os padrões, o dono salvaria por cima do que está no banco
    // achando que estava editando o valor atual.
    console.error("[platform] falha ao ler a configuração da plataforma:", error);
    throw new Error("Não foi possível carregar a configuração da plataforma.");
  }

  if (!data) return { ...PADROES, linhaExiste: false };

  return {
    platformName: (data.platform_name as string) || PADROES.platformName,
    supportEmail: (data.support_email as string | null) ?? null,
    trialDays: Number(data.trial_days ?? PADROES.trialDays),
    trialModuleSlugs: (data.trial_module_slugs as string[] | null) ?? null,
    storefrontGraceDays: Number(data.storefront_grace_days ?? PADROES.storefrontGraceDays),
    updatedAt: (data.updated_at as string | null) ?? null,
    updatedBy: (data.updated_by as string | null) ?? null,
    linhaExiste: true,
  };
}

/** Uma variável de ambiente crítica, do jeito que a tela mostra. */
export type EnvCheck = {
  nome: string;
  /** O que essa variável faz, em português. */
  paraQueServe: string;
  /** O que PARA DE FUNCIONAR se ela estiver faltando. */
  seFaltar: string;
  configurada: boolean;
};

/**
 * Saúde do ambiente.
 *
 * Devolve SÓ `true`/`false` -- o valor da variável nunca sai daqui, nem
 * mascarado. Um trecho de chave já é chave suficiente para vazar.
 */
export function getEnvHealth(): EnvCheck[] {
  // `process.env.X` precisa ser escrito literalmente (o bundler substitui o
  // texto na hora do build); `process.env[nome]` devolveria sempre vazio.
  const valores: Record<string, string | undefined> = {
    // PLATFORM_DOMAIN passa pelo src/lib/env.ts, que é a leitura oficial dela.
    PLATFORM_DOMAIN: getEnv().PLATFORM_DOMAIN || undefined,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYMENT_KEY_ENC_KEY: process.env.PAYMENT_KEY_ENC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  const descricoes: Omit<EnvCheck, "configurada">[] = [
    {
      nome: "PLATFORM_DOMAIN",
      paraQueServe: "É o endereço da plataforma na internet, usado para dar um endereço próprio a cada loja.",
      seFaltar:
        "A plataforma continua funcionando com uma loja só, no endereço atual. Cada loja NÃO ganha o próprio endereço e o botão 'entrar na loja' abre sempre o mesmo painel.",
    },
    {
      nome: "EMAIL_FROM",
      paraQueServe: "É o remetente que aparece nos e-mails que o sistema envia.",
      seFaltar: "Nenhum e-mail sai do sistema: nem confirmação de pedido, nem aviso de cobrança, nem recuperação de senha.",
    },
    {
      nome: "RESEND_API_KEY",
      paraQueServe: "É a senha do serviço que efetivamente entrega os e-mails (Resend).",
      seFaltar: "Nenhum e-mail sai do sistema. O pedido é criado normalmente, mas o cliente não recebe nada.",
    },
    {
      nome: "PAYMENT_KEY_ENC_KEY",
      paraQueServe: "É a chave que embaralha (criptografa) a credencial de pagamento de cada loja antes de guardar no banco.",
      seFaltar:
        "Nenhuma loja consegue cadastrar a própria conta de recebimento, então nenhuma loja nova consegue vender. As lojas já configuradas param de conseguir cobrar.",
    },
    {
      nome: "SUPABASE_SERVICE_ROLE_KEY",
      paraQueServe: "É a chave que o servidor usa para ler e gravar no banco sem depender do login de quem está na tela.",
      seFaltar: "Este painel não abre e nada da plataforma funciona. Se você está lendo esta tela, ela está configurada.",
    },
    {
      nome: "CRON_SECRET",
      paraQueServe:
        "É a senha que vai proteger as rotinas automáticas (expirar teste, cobrar, tirar vitrine do ar). Hoje nenhuma rotina automática existe ainda no sistema — esta variável é preparação para quando existirem.",
      seFaltar:
        "Nada para de funcionar hoje. Quando as rotinas automáticas forem criadas, sem esta senha elas ficariam sem tranca — qualquer pessoa que descobrisse o endereço poderia dispará-las —, e o certo é que a rotina RECUSE rodar enquanto a senha faltar.",
    },
  ];

  return descricoes.map((d) => ({ ...d, configurada: Boolean((valores[d.nome] ?? "").trim()) }));
}
