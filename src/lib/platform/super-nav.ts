/**
 * O menu do painel da plataforma, em UM lugar só.
 *
 * Isto é dado puro (strings), de propósito: o nome do ícone viaja como texto e
 * cada lado resolve o componente no seu próprio mapa. Passar o ícone (que é uma
 * função React) do servidor para um componente de cliente derruba a página em
 * produção sem o build nem o `tsc` reclamarem -- já aconteceu neste projeto.
 *
 * Agrupado em DEPARTAMENTOS (guarda-chuvas em accordion), igual ao painel do
 * lojista: "Início" fica solto no topo; o resto abre/fecha por departamento.
 * Mover um item = trocar de lista aqui; nada mais.
 */

export type SuperNavItem = {
  href: string;
  label: string;
  iconName: string;
  /** Uma linha explicando a tela, para quem não é dev. */
  hint: string;
  /** Abre fora do painel (vitrine pública). */
  external?: boolean;
};

export type SuperNavGroup = {
  id: string;
  label: string;
  /** Ícone do departamento (nome lucide, texto). */
  iconName: string;
  items: SuperNavItem[];
};

/** Fica solto no topo, fora de qualquer departamento. */
export const SUPER_NAV_STANDALONE: SuperNavItem = {
  href: "/super",
  label: "Início",
  iconName: "LayoutDashboard",
  hint: "Resumo de todas as lojas.",
};

export const SUPER_NAV_GROUPS: SuperNavGroup[] = [
  {
    id: "lojas",
    label: "Lojas",
    iconName: "Store",
    items: [
      { href: "/super/lojas", label: "Lojas", iconName: "Store", hint: "Cada loja, o plano dela e o que você pode liberar." },
      { href: "/super/uso", label: "Uso por loja", iconName: "BarChart3", hint: "Quantos produtos, pedidos e clientes cada loja tem." },
      { href: "/super/vouchers", label: "Cortesias", iconName: "Ticket", hint: "Códigos que liberam acesso sem cobrar." },
      { href: "/super/financeiro", label: "Financeiro", iconName: "CircleDollarSign", hint: "Receita recorrente estimada e situação das assinaturas." },
    ],
  },
  {
    id: "vitrine",
    label: "Vitrine da plataforma",
    iconName: "Tags",
    items: [
      { href: "/super/planos", label: "Planos & Preços", iconName: "Tags", hint: "Quanto custa cada plano e o que cada um libera." },
      { href: "/super/landing", label: "Página de vendas", iconName: "LayoutTemplate", hint: "Os textos da página que convence o lojista a assinar." },
      { href: "/super/marca", label: "Marca da plataforma", iconName: "Palette", hint: "Logo e ícone da plataforma (não os da loja)." },
      { href: "/plataforma", label: "Ver a página", iconName: "ExternalLink", hint: "Abre a página de vendas como o visitante vê.", external: true },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    iconName: "LifeBuoy",
    items: [
      { href: "/super/erros", label: "Erros & Alertas", iconName: "TriangleAlert", hint: "O que falhou nas lojas e o que o cliente delas sentiu." },
      { href: "/super/suporte", label: "Suporte", iconName: "LifeBuoy", hint: "Chamados abertos nas lojas, todos num lugar." },
      { href: "/super/auditoria", label: "Auditoria", iconName: "ScrollText", hint: "Quem entrou na loja de quem e o que mudou." },
    ],
  },
  {
    id: "config",
    label: "Configurações",
    iconName: "Settings",
    items: [
      { href: "/super/equipe", label: "Equipe & Acesso", iconName: "Users", hint: "Quem mais pode administrar a plataforma." },
      { href: "/super/configuracoes", label: "Configurações", iconName: "Settings", hint: "Dias de teste, carência e saúde do ambiente." },
    ],
  },
];

/** Achata tudo (Início + departamentos) -- útil para busca. */
export const SUPER_NAV_ITEMS: SuperNavItem[] = [
  SUPER_NAV_STANDALONE,
  ...SUPER_NAV_GROUPS.flatMap((g) => g.items),
];
