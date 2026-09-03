// Catálogo real da Juliana Cestas, extraído do material que ela enviou
// (Canva "Cestas de Café da Manhã — Juliana Cestas", 2026-09-02).
// Preços e descrições são REAIS. Fotos em public/images/produtos/ também são
// reais (WhatsApp da cliente); o vínculo foto->produto é uma escolha nossa
// (a melhor combinação visual disponível), não veio confirmado item a item.

export type Product = {
  id: string;
  slug: string;
  name: string;
  serves: string;
  size: string;
  price: number;
  items: string[];
  packaging: string;
  image: string;
  badge?: string;
};

const p = (file: string) => `/images/produtos/${file}`;

export const featuredProducts: Product[] = [
  {
    id: "enquanto",
    slug: "cesta-enquanto",
    name: "Cesta Enquanto",
    serves: "Para 1 pessoa",
    size: "P",
    price: 179.9,
    items: [
      "Flores",
      "Bolo",
      "Croissant recheado",
      "Nutella",
      "Cappuccino",
      "Chá",
      "Café",
      "Suco de uva integral",
    ],
    packaging: "Embalagem em tule, delicada e charmosa. Acompanha laço elegante e cartão.",
    image: p("cesta-doce-manha.webp"),
  },
  {
    id: "afeto",
    slug: "cesta-afeto",
    name: "Cesta Afeto",
    serves: "Para 1 pessoa",
    size: "P",
    price: 189.9,
    items: [
      "Bolo",
      "Waffle",
      "Croissant",
      "Frutas",
      "Frios selecionados",
      "Cappuccino",
      "Chá",
      "Café ou suco de uva integral",
    ],
    packaging: "Embalagem sofisticada, delicada e charmosa. Acompanha laço elegante e cartão.",
    image: p("cesta-aniversario-especial.webp"),
  },
  {
    id: "essencia",
    slug: "cesta-essencia",
    name: "Cesta Essência",
    serves: "Para 1 pessoa",
    size: "Orgânica",
    price: 289.9,
    items: [
      "Bolo caseiro",
      "Waffle e pães",
      "Croissant",
      "Frios selecionados",
      "Biscoitos",
      "Frutas",
      "Cappuccino, café e chá",
      "Geleia ou Nutella",
      "Suco de uva integral",
    ],
    packaging: "Embalagem sofisticada, delicada e charmosa — perfeita para surpreender com amor.",
    image: p("cesta-cafe-completo.webp"),
    badge: "Mais pedida",
  },
  {
    id: "aconchego",
    slug: "cesta-aconchego",
    name: "Cesta Aconchego",
    serves: "Para 2 pessoas",
    size: "M",
    price: 359.9,
    items: [
      "Variedade de pães especiais",
      "Croissant",
      "Waffles",
      "Frios selecionados premium",
      "Bolo caseiro especial",
      "Biscoitos amanteigados",
      "Mix de frutas frescas",
      "Suco natural",
      "Drip coffee e chá",
      "Cappuccino",
      "Geleia e mini Nutella",
      "Chocolates",
    ],
    packaging: "Embalagem refinada, delicada e charmosa. Acompanha laço elegante e cartão personalizado.",
    image: p("cesta-presente-corporativo.webp"),
  },
  {
    id: "memoravel",
    slug: "cesta-memoravel",
    name: "Cesta Memorável",
    serves: "Perfeita para 2 ou 3 pessoas",
    size: "G",
    price: 489.9,
    items: [
      "Croissants especiais",
      "Waffles",
      "Frios nobres e queijos",
      "Bolo especial",
      "Frutas selecionadas",
      "Chocolates",
      "Seleção premium de pães artesanais",
      "Geleia artesanal, Nutella e manteiga",
      "Itens gourmet diferenciados",
      "Biscoitos amanteigados",
      "Drip coffee e chás",
      "Suco",
    ],
    packaging: "Embalagem luxo, acabamento impecável. Acompanha laço delicado e cartão personalizado. Adicional de vinho por R$ 49,90.",
    image: p("cesta-romance-ao-amanhecer.webp"),
  },
];

export const collectionPresentes: Product[] = featuredProducts.filter(
  (item) => item.price <= 200
);

export const faqItems = [
  {
    question: "Como faço meu pedido?",
    answer:
      "As reservas são feitas pelo WhatsApp (61) 99889-4889. Pedidos devem ser feitos com 24 horas de antecedência; pedidos personalizados exigem 3 dias.",
  },
  {
    question: "Como funciona o cartão personalizado?",
    answer:
      "Cada cesta acompanha um cartão com laço elegante. Você escreve a mensagem e o nome de quem vai receber na hora do pedido.",
  },
  {
    question: "Quais as formas de pagamento?",
    answer:
      "Pix ou cartão de crédito, com pagamento via link. O pedido é confirmado após o pagamento integral.",
  },
  {
    question: "Como funcionam as entregas?",
    answer:
      "As entregas são feitas por motoristas terceirizados ou Uber, com taxa própria, de forma agendada. Pode haver variação de até 20 minutos por fatores fora do nosso controle (trânsito, clima). Se não houver quem receba, uma nova tentativa tem taxa de reentrega.",
  },
  {
    question: "Um item pode ser substituído?",
    answer:
      "Todas as cestas são produzidas artesanalmente por encomenda. Se algum item estiver indisponível, ele é substituído por outro de valor equivalente, mantendo o padrão da cesta.",
  },
];

export const benefits = [
  {
    title: "Feita à mão",
    description: "Cada cesta é produzida artesanalmente, por encomenda.",
    icon: "PenLine" as const,
  },
  {
    title: "Pagamento seguro",
    description: "Pix ou cartão, via link de pagamento.",
    icon: "ShieldCheck" as const,
  },
  {
    title: "Entrega agendada",
    description: "Motorista dedicado, com hora combinada.",
    icon: "Truck" as const,
  },
  {
    title: "Atendimento no WhatsApp",
    description: "Fale direto com a Juliana Cestas.",
    icon: "Headset" as const,
  },
];
