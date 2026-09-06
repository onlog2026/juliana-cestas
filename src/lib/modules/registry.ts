/**
 * REGISTRO ÚNICO DE MÓDULOS DA PLATAFORMA.
 *
 * Esta é a ÚNICA lista de módulos que existe no código TypeScript. Ela tem que
 * bater, slug por slug, com o `insert into platform_modules` da migração
 * `supabase/migrations/0026_platform_plans_vouchers.sql`.
 *
 * Por que uma lista só, com teste:
 * no Agentop existiam QUATRO listas espelhadas (front, backend, RLS e o painel
 * do dono). Elas divergiram três vezes; numa delas a cortesia de um módulo
 * virou botão morto por dois dias, porque o módulo existia num lugar e não
 * existia no outro. A regra que veio daquele incidente
 * (docs/SUPER-ADMIN-SPEC.md, armadilha 6) é: se front, backend e RLS precisam
 * da mesma lista, ela mora no banco -- e o código guarda uma cópia PROVADA
 * igual. Quem prova é `tests/unit/registry.test.ts`, que abre o arquivo .sql,
 * extrai os módulos do INSERT e falha se qualquer coisa divergir daqui.
 *
 * Este arquivo é dado puro (só strings, números e booleanos). Nada de ícone
 * (que é função React) e nada de import de banco: assim ele pode ser lido por
 * componente de servidor, de cliente e por teste unitário sem nenhum efeito
 * colateral.
 */

export type ModuleCategory = "nucleo" | "operacao" | "vendas" | "vitrine" | "crescimento";

/** Como o módulo aparece no menu do painel da loja. */
export type ModuleMenuEntry = {
  /** Rota real que já existe no app. Módulo sem tela não tem menu. */
  href: string;
  /** O que a lojista lê no menu (pode ser mais curto que o nome do módulo). */
  label: string;
  /**
   * NOME do ícone do lucide-react, como texto.
   *
   * De propósito não é o componente: passar uma função de ícone de um
   * componente de servidor para um de cliente derruba a página em produção
   * mesmo passando no `tsc` e no build (já aconteceu neste projeto -- veja
   * o comentário em `src/components/admin/mobile-nav-drawer.tsx`).
   */
  iconName: string;
  /**
   * Ordem no menu. É SEPARADA de `sortOrder` de propósito: `sortOrder` é a
   * ordem do catálogo de módulos no banco, e usá-la no menu mudaria a ordem
   * que a Juliana usa todo dia (Configurações pularia para a quarta posição).
   * Código que funciona não muda de aparência sem alguém pedir.
   */
  menuOrder: number;
};

export type ModuleDefinition = {
  slug: string;
  /** Nome do módulo. Igual ao da tabela `platform_modules`. */
  name: string;
  /** Uma frase explicando o módulo para quem não é dev. */
  description: string;
  category: ModuleCategory;
  /** Núcleo: nunca é bloqueado por plano. Sem ele a loja não funciona. */
  isCore: boolean;
  /** Ordem no catálogo (igual à do banco). NÃO é a ordem do menu. */
  sortOrder: number;
  /** Presente só nos módulos que já têm tela pronta no painel. */
  menu?: ModuleMenuEntry;
};

/**
 * Pseudo-módulo da tela de assinatura/cobrança.
 *
 * NÃO está em `platform_modules` de propósito: não é algo que se venda nem que
 * se bloqueie -- é a tela onde a lojista resolve a pendência. Junto com
 * `configuracoes`, é o que continua aberto mesmo com a conta bloqueada; sem
 * isso, quem atrasa o pagamento fica trancado do lado de fora sem nenhum
 * caminho para voltar.
 */
export const BILLING_MODULE_SLUG = "assinatura";

/**
 * O que continua acessível mesmo com a assinatura vencida.
 * Trancar a lojista fora das configurações e da própria cobrança seria
 * trancá-la fora do caminho de voltar a pagar.
 */
export const ALWAYS_AVAILABLE_SLUGS: readonly string[] = ["configuracoes", BILLING_MODULE_SLUG];

/**
 * Plano da primeira loja da plataforma (a loja da Juliana, migração 0026).
 * Tudo incluído, nunca bloqueia, não aparece na vitrine. É verificado
 * explicitamente no resolvedor de acesso -- cinto E suspensório: mesmo que a
 * leitura de `plan_modules` falhe ou venha incompleta, a loja dela não sente
 * nada.
 */
export const FOUNDER_PLAN_SLUG = "fundadora";

/**
 * O catálogo. Cópia fiel de `platform_modules` (migração 0026) + a informação
 * de menu, que só existe no código porque só o código sabe quais telas existem.
 */
export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  {
    slug: "dashboard",
    name: "Painel de vendas",
    description: "Faturamento, pedidos e produtos mais vendidos.",
    category: "nucleo",
    isCore: true,
    sortOrder: 1,
    menu: { href: "/admin", label: "Início", iconName: "LayoutDashboard", menuOrder: 1 },
  },
  {
    slug: "pedidos",
    name: "Pedidos",
    description: "Receber, acompanhar e mudar o status dos pedidos.",
    category: "nucleo",
    isCore: true,
    sortOrder: 2,
    menu: { href: "/admin/pedidos", label: "Pedidos", iconName: "Package", menuOrder: 2 },
  },
  {
    slug: "produtos",
    name: "Produtos",
    description: "Cadastro de produtos, fotos, estoque e preços.",
    category: "nucleo",
    isCore: true,
    sortOrder: 3,
    menu: { href: "/admin/produtos", label: "Produtos", iconName: "ShoppingBasket", menuOrder: 5 },
  },
  {
    slug: "configuracoes",
    name: "Configurações da loja",
    description: "Dados do negócio, endereço e contato.",
    category: "nucleo",
    isCore: true,
    sortOrder: 4,
    menu: { href: "/admin/configuracoes", label: "Configurações", iconName: "Settings", menuOrder: 9 },
  },
  {
    slug: "pagamentos",
    name: "Pagamentos",
    description: "Conectar a conta de recebimento da loja.",
    category: "nucleo",
    isCore: true,
    sortOrder: 5,
    // A tela passou a existir, então o item entra no menu. A regra continua a
    // mesma: módulo sem rota real NUNCA aparece -- item de menu que leva a uma
    // tela inexistente é pior do que menu curto.
    menu: { href: "/admin/pagamentos", label: "Pagamentos", iconName: "CreditCard", menuOrder: 10 },
  },
  {
    slug: "entregas",
    name: "Entregas",
    description: "Agenda de entregas por dia e horário.",
    category: "operacao",
    isCore: false,
    sortOrder: 10,
    menu: { href: "/admin/entregas", label: "Entregas", iconName: "Truck", menuOrder: 3 },
  },
  {
    slug: "atendimento",
    name: "Atendimento",
    description: "Chamados dos clientes da loja.",
    category: "operacao",
    isCore: false,
    sortOrder: 11,
    menu: { href: "/admin/atendimento", label: "Atendimento", iconName: "Headset", menuOrder: 4 },
  },
  {
    slug: "cupons",
    name: "Cupons de desconto",
    description: "Criar cupons por valor, percentual ou frete grátis.",
    category: "vendas",
    isCore: false,
    sortOrder: 12,
    menu: { href: "/admin/cupons", label: "Cupons", iconName: "Ticket", menuOrder: 6 },
  },
  {
    slug: "cms",
    name: "Banners e textos",
    description: "Editar banners, categorias e textos do site.",
    category: "vitrine",
    isCore: false,
    sortOrder: 13,
    menu: { href: "/admin/cms", label: "CMS", iconName: "LayoutTemplate", menuOrder: 7 },
  },
  {
    slug: "seo",
    name: "SEO",
    description: "Título, descrição e palavras-chave para o Google.",
    category: "vitrine",
    isCore: false,
    sortOrder: 14,
    menu: { href: "/admin/seo", label: "SEO", iconName: "Search", menuOrder: 8 },
  },
  {
    slug: "templates",
    name: "Modelos de loja",
    description: "Escolher e trocar o modelo visual da loja.",
    category: "vitrine",
    isCore: false,
    sortOrder: 15,
    menu: { href: "/admin/modelos", label: "Modelos", iconName: "Shapes", menuOrder: 13 },
  },
  {
    slug: "paginas",
    name: "Páginas",
    description: "Montar e reordenar as seções das páginas.",
    category: "vitrine",
    isCore: false,
    sortOrder: 16,
  },
  {
    slug: "galeria",
    name: "Galeria e vídeos",
    description: "Biblioteca de fotos e vídeos da loja.",
    category: "vitrine",
    isCore: false,
    sortOrder: 17,
    menu: { href: "/admin/galeria", label: "Galeria", iconName: "Images", menuOrder: 14 },
  },
  {
    slug: "marcas",
    name: "Marcas",
    description: "Cadastro de marcas dos produtos.",
    category: "vitrine",
    isCore: false,
    sortOrder: 18,
    menu: { href: "/admin/marcas", label: "Marcas", iconName: "Tag", menuOrder: 15 },
  },
  {
    slug: "ia",
    name: "Assistente de IA",
    description: "Escreve descrição e SEO do produto.",
    category: "crescimento",
    isCore: false,
    sortOrder: 19,
  },
  {
    slug: "social",
    name: "Redes sociais",
    description: "Conectar Instagram e mostrar o feed na loja.",
    category: "crescimento",
    isCore: false,
    sortOrder: 20,
  },
  {
    slug: "dominio",
    name: "Domínio próprio",
    description: "Usar o próprio endereço (www.sualoja.com.br).",
    category: "crescimento",
    isCore: false,
    sortOrder: 21,
  },
  {
    slug: "equipe",
    name: "Equipe",
    description: "Convidar pessoas e escolher o que cada uma acessa.",
    category: "operacao",
    isCore: false,
    sortOrder: 22,
    menu: { href: "/admin/equipe", label: "Equipe", iconName: "Users", menuOrder: 16 },
  },
  {
    slug: "financeiro",
    name: "Financeiro",
    description: "Recebíveis, saldo e extrato da loja.",
    category: "operacao",
    isCore: false,
    sortOrder: 23,
  },
  {
    slug: "automacoes",
    name: "Automações",
    description: "E-mails automáticos e recuperação de carrinho.",
    category: "crescimento",
    isCore: false,
    sortOrder: 24,
  },
  {
    slug: "avaliacoes",
    name: "Avaliações",
    description: "Pedir e publicar avaliação de quem comprou.",
    category: "crescimento",
    isCore: false,
    sortOrder: 25,
    menu: { href: "/admin/avaliacoes", label: "Avaliações", iconName: "Star", menuOrder: 11 },
  },
  {
    slug: "estoque",
    name: "Estoque",
    description: "Saldo, custo, estoque mínimo e o extrato de cada entrada e saída.",
    category: "operacao",
    isCore: false,
    sortOrder: 26,
    menu: { href: "/admin/estoque", label: "Estoque", iconName: "Boxes", menuOrder: 17 },
  },
  {
    slug: "compras",
    name: "Compras",
    description: "Compras de insumos: alimenta o estoque e lança a despesa.",
    category: "operacao",
    isCore: false,
    sortOrder: 27,
    menu: { href: "/admin/compras", label: "Compras", iconName: "ShoppingCart", menuOrder: 18 },
  },
];

/** Todos os slugs, na ordem do catálogo. */
export const MODULE_SLUGS: readonly string[] = MODULE_REGISTRY.map((m) => m.slug);

/**
 * Núcleo: nunca bloqueia, em nenhum plano. São as cinco coisas sem as quais
 * "loja" não quer dizer nada -- ver, receber e cadastrar, configurar e receber
 * dinheiro.
 */
export const CORE_MODULE_SLUGS: readonly string[] = MODULE_REGISTRY.filter((m) => m.isCore).map((m) => m.slug);

const POR_SLUG = new Map(MODULE_REGISTRY.map((m) => [m.slug, m]));

/** O módulo, ou `null` se o slug não existir no registro. */
export function getModule(slug: string | null | undefined): ModuleDefinition | null {
  if (!slug) return null;
  return POR_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

/** O slug existe no registro? */
export function isKnownModule(slug: string | null | undefined): boolean {
  return getModule(slug) !== null;
}

/** É módulo do núcleo (nunca bloqueia)? */
export function isCoreModule(slug: string | null | undefined): boolean {
  return getModule(slug)?.isCore === true;
}

/** Continua aberto mesmo com a conta bloqueada? */
export function isAlwaysAvailable(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ALWAYS_AVAILABLE_SLUGS.includes(slug.trim().toLowerCase());
}

/** Nome do módulo para mostrar na tela; cai no próprio slug se for desconhecido. */
export function moduleLabel(slug: string): string {
  return getModule(slug)?.name ?? slug;
}

/**
 * Os módulos que TÊM tela no painel da loja, já na ordem do menu.
 *
 * Regra invertida em relação ao Agentop de propósito: lá, módulo novo nascia
 * VISÍVEL e alguém tinha que lembrar de escondê-lo; aqui, quem não está neste
 * registro com uma rota real simplesmente não aparece. Item de menu que leva a
 * uma tela que não existe é pior do que menu curto.
 */
export const ADMIN_MENU_MODULES: readonly (ModuleDefinition & { menu: ModuleMenuEntry })[] = MODULE_REGISTRY
  .filter((m): m is ModuleDefinition & { menu: ModuleMenuEntry } => Boolean(m.menu))
  .slice()
  .sort((a, b) => a.menu.menuOrder - b.menu.menuOrder);
