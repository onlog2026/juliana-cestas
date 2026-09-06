/**
 * Conteúdo editável da LANDING DA PLATAFORMA (a página que vende a plataforma
 * para novos lojistas), em `site_content` com `tenant_id = null` e
 * `surface = 'platform'`.
 *
 * Mesmo desenho do conteúdo da loja (`src/modules/content/types.ts`): cada
 * seção tem um schema zod, o formulário do painel é gerado a partir dele, e
 * acrescentar um campo é mudar o schema -- não reescrever tela.
 *
 * DUAS REGRAS QUE VIERAM DE ERRO REAL (docs/SUPER-ADMIN-SPEC.md):
 *
 * 1. Só entra aqui a seção que a landing REALMENTE lê. No Agentop o CMS
 *    deixava editar 16 seções e só 3 apareciam no site -- o dono editava, via
 *    "salvo!", e nada mudava. Se um dia uma seção sair da página, ela sai
 *    DESTE arquivo no mesmo commit.
 *
 * 2. Título e lista da mesma seção moram no MESMO schema (e, por consequência,
 *    no mesmo formulário). Salvar grava a seção inteira: dois formulários
 *    separados para a mesma seção apagariam um ao outro.
 *
 * O preço dos planos NÃO está aqui de propósito -- vem da tabela
 * `subscription_plans`. Preço editável em CMS é preço inventado.
 */
import { z } from "zod";

/**
 * Ícones que a landing sabe desenhar. Lista fechada: o payload guarda o NOME
 * (string), e cada componente resolve o nome pelo próprio mapa. Componente de
 * ícone nunca atravessa a fronteira servidor → cliente.
 */
export const PLATFORM_ICONS = [
  "Gift",
  "Flower2",
  "Cake",
  "Palette",
  "Store",
  "ShoppingBag",
  "Package",
  "Heart",
  "Sparkles",
  "LayoutDashboard",
  "Wallet",
  "CreditCard",
  "Globe",
  "ImagePlus",
  "ChartColumn",
  "Truck",
  "MessageCircle",
  "ShieldCheck",
  "Smartphone",
  "Rocket",
] as const;

export type PlatformIconName = (typeof PLATFORM_ICONS)[number];

const iconSchema = z.enum(PLATFORM_ICONS);

/** Herói: o primeiro dobra da página. */
export const heroSchema = z.object({
  eyebrow: z.string().trim().max(80),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(400),
  primaryLabel: z.string().trim().min(1).max(40),
  secondaryLabel: z.string().trim().max(40),
  proof: z.string().trim().max(200),
  /** Itens do cartão à direita do herói. */
  highlights: z.array(z.object({ text: z.string().trim().min(1).max(80) })).max(6),
});

/** "Para quem é": os nichos de loja. */
export const audiencesSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        description: z.string().trim().min(1).max(140),
        icon: iconSchema,
      })
    )
    .max(6),
});

/**
 * "O que você recebe". O PRIMEIRO item é desenhado grande, ocupando duas
 * colunas -- é de propósito, para a seção não virar três cartões iguais. O
 * editor avisa isso.
 */
export const featuresSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(60),
        description: z.string().trim().min(1).max(220),
        icon: iconSchema,
      })
    )
    .max(9),
});

/** "Como funciona": a numeração sai da ordem da lista, não de um campo. */
export const stepsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(60),
        description: z.string().trim().min(1).max(220),
      })
    )
    .max(6),
});

/**
 * Texto de abertura da seção de planos. Os PLANOS em si (nome, preço, o que
 * inclui) vêm do banco -- aqui só a chamada.
 */
export const plansIntroSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300),
  note: z.string().trim().max(200),
});

export const landingFaqSchema = z.object({
  title: z.string().trim().min(1).max(120),
  items: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(1200),
      })
    )
    .max(20),
});

/** Faixa final: última chamada + rodapé. */
export const closingSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(400),
  buttonLabel: z.string().trim().min(1).max(40),
  footerNote: z.string().trim().max(200),
});

/**
 * Marca da PLATAFORMA (não da loja). Editada em /super/marca e lida pela
 * landing: o nome aparece no topo, a logo substitui o nome quando existe, e o
 * favicon vira o ícone da aba.
 */
export const platformBrandingSchema = z.object({
  wordmark: z.string().trim().min(1).max(40),
  logoUrl: z.string().trim().max(500),
  faviconUrl: z.string().trim().max(500),
});

/**
 * Toda seção da landing da plataforma, com seu formato.
 *
 * Cada chave daqui é lida por um componente de
 * `src/components/platform/landing/`. Nenhuma é decorativa.
 */
export const PLATFORM_SECTIONS = {
  hero: heroSchema,
  audiences: audiencesSchema,
  features: featuresSchema,
  steps: stepsSchema,
  plans_intro: plansIntroSchema,
  faq: landingFaqSchema,
  closing: closingSchema,
  branding: platformBrandingSchema,
} as const;

export type PlatformSection = keyof typeof PLATFORM_SECTIONS;
export type PlatformContent = {
  [K in PlatformSection]: z.infer<(typeof PLATFORM_SECTIONS)[K]>;
};

/**
 * Texto padrão. A landing precisa ficar bonita e vendedora mesmo com o banco
 * vazio -- é o que aparece antes de alguém editar qualquer coisa.
 */
export const PLATFORM_DEFAULTS: PlatformContent = {
  hero: {
    eyebrow: "Plataforma de lojas virtuais",
    title: "Sua loja no ar, do jeito que ela é — sem depender de ninguém",
    subtitle:
      "Você monta a vitrine, recebe os pedidos e edita os textos e as fotos você mesma. O dinheiro cai na sua conta, não na nossa.",
    primaryLabel: "Criar minha loja",
    secondaryLabel: "Ver planos",
    proof: "Feita para quem vende presente, flor, doce e artesanato — não para quem entende de tecnologia.",
    highlights: [
      { text: "Endereço próprio: www.sualoja.com.br" },
      { text: "Pedido novo chega com endereço e horário" },
      { text: "Banner e texto você troca sozinha" },
      { text: "Funciona no celular do seu cliente" },
    ],
  },
  audiences: {
    title: "Para quem é",
    subtitle: "Lojas que vendem coisa feita com cuidado e precisam de uma vitrine à altura.",
    items: [
      {
        name: "Cestas e presentes",
        description: "Cesta de café da manhã, kit comemorativo, presente com cartão escrito à mão.",
        icon: "Gift",
      },
      {
        name: "Floricultura",
        description: "Buquê, arranjo e coroa com entrega marcada por dia e horário.",
        icon: "Flower2",
      },
      {
        name: "Doces e bolos",
        description: "Encomenda com data de retirada, sabor escolhido e recheio à parte.",
        icon: "Cake",
      },
      {
        name: "Artesanato",
        description: "Peça única, sob encomenda, com foto que faz jus ao trabalho.",
        icon: "Palette",
      },
    ],
  },
  features: {
    title: "O que você recebe",
    subtitle: "Tudo que uma loja precisa para vender de verdade, pronto no primeiro dia.",
    items: [
      {
        title: "Loja no ar",
        description:
          "Vitrine com catálogo, carrinho e checkout que funciona no celular. Seus produtos, suas fotos, seu jeito de escrever — sem template com cara de todo mundo.",
        icon: "Store",
      },
      {
        title: "Painel de pedidos",
        description: "Cada pedido com endereço, horário e situação. Você acompanha do jeito que já acompanha hoje.",
        icon: "LayoutDashboard",
      },
      {
        title: "Pagamento na sua conta",
        description: "O cliente paga e o dinheiro entra direto na sua conta. A plataforma não fica no meio.",
        icon: "Wallet",
      },
      {
        title: "Domínio próprio",
        description: "Use o seu endereço na internet. Quem chega vê a sua marca, não a nossa.",
        icon: "Globe",
      },
      {
        title: "Banners e textos por sua conta",
        description: "Trocar a foto do topo, o preço e o texto da página é você quem faz, na hora, sem pedir para ninguém.",
        icon: "ImagePlus",
      },
      {
        title: "Relatórios",
        description: "Quanto vendeu, o que mais saiu e quantos pedidos ainda faltam entregar.",
        icon: "ChartColumn",
      },
    ],
  },
  steps: {
    title: "Como funciona",
    subtitle: "Três passos. Nenhum deles exige saber programar.",
    items: [
      {
        title: "Cadastre a sua loja",
        description: "Nome, endereço na internet e o e-mail que vai receber os pedidos.",
      },
      {
        title: "Escolha o modelo",
        description: "Um ponto de partida pronto para o seu tipo de loja. Depois é só trocar fotos, cores e textos.",
      },
      {
        title: "Comece a vender",
        description: "Divulgue o link. O pedido chega no seu painel com tudo que você precisa para entregar.",
      },
    ],
  },
  plans_intro: {
    title: "Planos",
    subtitle: "Escolha pelo tamanho da sua operação. Dá para mudar de plano depois, sem perder nada.",
    note: "Valores por mês. Sem taxa por venda cobrada pela plataforma.",
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Preciso entender de tecnologia?",
        answer:
          "Não. A loja nasce pronta e tudo que você muda no dia a dia — foto, preço, texto, banner — é por um formulário simples, sem código.",
      },
      {
        question: "Como eu recebo o dinheiro das vendas?",
        answer:
          "Você conecta a sua própria conta de recebimento. O cliente paga e o valor entra direto para você — a plataforma não segura o seu dinheiro.",
      },
      {
        question: "Posso usar o meu próprio endereço na internet?",
        answer:
          "Pode. Se você já tem um domínio, a gente aponta ele para a sua loja. Se não tem, você começa com um endereço da plataforma e troca depois.",
      },
      {
        question: "E se eu quiser sair?",
        answer:
          "Você cancela quando quiser. Seus produtos, pedidos e clientes continuam sendo seus, e a gente entrega a exportação dos dados.",
      },
      {
        question: "Dá para eu mesma mexer no visual?",
        answer:
          "Dá. Banner, cores, fotos, textos das páginas e ordem das seções ficam no seu painel. O que exige a gente é só o que envolve domínio e pagamento.",
      },
    ],
  },
  closing: {
    title: "Pronta para colocar a sua loja no ar?",
    body: "Comece hoje e veja a sua vitrine funcionando antes de decidir qualquer coisa.",
    buttonLabel: "Criar minha loja",
    footerNote: "Plataforma de lojas virtuais para quem vende feito à mão.",
  },
  branding: {
    wordmark: "Plataforma",
    logoUrl: "",
    faviconUrl: "",
  },
};
