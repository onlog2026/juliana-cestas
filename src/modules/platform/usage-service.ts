import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformTenant } from "./service";

/**
 * Quanto cada loja realmente usa a plataforma: quantos produtos cadastrou,
 * quantos pedidos recebeu, quantos clientes tem, quantos banners publicou.
 *
 * É a tela que responde "quem está grande e quem está parado" — serve tanto
 * para upsell (quem chegou perto do limite do plano) quanto para churn
 * (quem paga e não usa).
 *
 * REGRA DE HONESTIDADE (a razão de tudo aqui usar `number | null`):
 * `0` e "não consegui ler" são coisas DIFERENTES. Se a consulta falhar, o
 * campo vem `null` e a tela mostra "—". Mostrar zero para um erro de leitura
 * faria o dono achar que uma loja está vazia quando, na verdade, o banco não
 * respondeu — foi exatamente assim que uma tela do Agentop apareceu vazia por
 * dias sem ninguém desconfiar.
 */

/** Uma contagem: número quando a leitura deu certo, `null` quando falhou. */
export type Contagem = number | null;

export type UsoDaLoja = {
  tenantId: string;
  nome: string;
  slug: string;
  plano: string | null;
  subscriptionStatus: PlatformTenant["subscriptionStatus"];
  vitrineSuspensa: boolean;
  produtos: Contagem;
  pedidos: Contagem;
  pedidos30d: Contagem;
  clientes: Contagem;
  banners: Contagem;
  /** `true` se pelo menos uma das contagens desta loja falhou. */
  temFalhaDeLeitura: boolean;
};

type ClienteAdmin = ReturnType<typeof createAdminClient>;

/**
 * Conta as linhas de uma tabela para uma loja, sem trazer nenhum dado
 * (`head: true` = só o cabeçalho com o total). Devolve `null` em caso de erro,
 * nunca 0.
 *
 * Todas as tabelas usadas aqui têm mesmo a coluna `tenant_id` — conferido nas
 * migrações 0002_catalog.sql (`products`, `banners`) e 0004_orders.sql
 * (`orders`, `customers`). Nome de tabela aqui não é chute.
 */
async function contarPorLoja(
  admin: ClienteAdmin,
  tabela: "products" | "orders" | "customers" | "banners",
  tenantId: string,
  desdeIso?: string
): Promise<Contagem> {
  let consulta = admin
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (desdeIso) consulta = consulta.gte("created_at", desdeIso);

  const { count, error } = await consulta;

  if (error) {
    // Registrado no console do servidor para dar para investigar depois; na
    // tela vira "—". Uma coluna inexistente derruba a consulta inteira no
    // PostgREST, e engolir isso como zero é o pior resultado possível.
    console.error(
      `[platform/uso] falha ao contar ${tabela} da loja ${tenantId}${desdeIso ? " (últimos 30 dias)" : ""}:`,
      error
    );
    return null;
  }

  return count ?? 0;
}

/**
 * Monta a linha de uso de TODAS as lojas.
 *
 * CUSTO: são 5 consultas de contagem por loja, todas em paralelo. Com as
 * poucas lojas de hoje isso é instantâneo. NÃO ESCALA além de umas 50 lojas
 * (250 consultas por carregamento de tela, e o Supabase começa a enfileirar).
 *
 * Quando passar disso, o caminho é trocar este laço por UMA consulta agregada
 * no banco — uma view `tenant_usage` com `select tenant_id, count(*) ... group
 * by tenant_id` por tabela, ou uma função SQL que devolva tudo pronto numa
 * chamada só. A tela não precisa mudar: só a origem do dado.
 */
export async function listTenantUsage(tenants: PlatformTenant[]): Promise<UsoDaLoja[]> {
  const admin = createAdminClient();

  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return Promise.all(
    tenants.map(async (loja) => {
      const [produtos, pedidos, pedidos30d, clientes, banners] = await Promise.all([
        contarPorLoja(admin, "products", loja.id),
        contarPorLoja(admin, "orders", loja.id),
        contarPorLoja(admin, "orders", loja.id, trintaDiasAtras),
        contarPorLoja(admin, "customers", loja.id),
        contarPorLoja(admin, "banners", loja.id),
      ]);

      return {
        tenantId: loja.id,
        nome: loja.name,
        slug: loja.slug,
        plano: loja.subscriptionPlan,
        subscriptionStatus: loja.subscriptionStatus,
        vitrineSuspensa: loja.status === "suspended",
        produtos,
        pedidos,
        pedidos30d,
        clientes,
        banners,
        temFalhaDeLeitura: [produtos, pedidos, pedidos30d, clientes, banners].some((c) => c === null),
      };
    })
  );
}

/** Colunas pelas quais a tabela de uso pode ser ordenada. */
export const COLUNAS_ORDENAVEIS = [
  "nome",
  "plano",
  "situacao",
  "produtos",
  "pedidos",
  "pedidos30d",
  "clientes",
  "banners",
] as const;

export type ColunaOrdenavel = (typeof COLUNAS_ORDENAVEIS)[number];

export function ehColunaOrdenavel(valor: string | undefined): valor is ColunaOrdenavel {
  return !!valor && (COLUNAS_ORDENAVEIS as readonly string[]).includes(valor);
}

/**
 * Ordena a lista de uso. Números vão do maior para o menor por padrão (é o que
 * interessa: quem usa mais); texto vai em ordem alfabética.
 *
 * Contagem que falhou (`null`) vai SEMPRE para o fim, nos dois sentidos —
 * "não sei" não é nem o maior nem o menor valor, e não pode se disfarçar de
 * zero no topo ou no fim de uma ordenação.
 */
export function ordenarUso(
  linhas: UsoDaLoja[],
  coluna: ColunaOrdenavel,
  direcao: "asc" | "desc"
): UsoDaLoja[] {
  const sinal = direcao === "asc" ? 1 : -1;

  const numeroDe = (linha: UsoDaLoja): Contagem => {
    switch (coluna) {
      case "produtos":
        return linha.produtos;
      case "pedidos":
        return linha.pedidos;
      case "pedidos30d":
        return linha.pedidos30d;
      case "clientes":
        return linha.clientes;
      case "banners":
        return linha.banners;
      default:
        return null;
    }
  };

  const textoDe = (linha: UsoDaLoja): string => {
    switch (coluna) {
      case "plano":
        return linha.plano ?? "";
      case "situacao":
        return linha.subscriptionStatus;
      default:
        return linha.nome;
    }
  };

  const ehNumerica = coluna !== "nome" && coluna !== "plano" && coluna !== "situacao";

  return [...linhas].sort((a, b) => {
    if (ehNumerica) {
      const va = numeroDe(a);
      const vb = numeroDe(b);
      if (va === null && vb === null) return a.nome.localeCompare(b.nome, "pt-BR");
      if (va === null) return 1; // "—" sempre no fim
      if (vb === null) return -1;
      if (va !== vb) return (va - vb) * sinal;
      return a.nome.localeCompare(b.nome, "pt-BR");
    }
    const comparacao = textoDe(a).localeCompare(textoDe(b), "pt-BR");
    if (comparacao !== 0) return comparacao * sinal;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}
