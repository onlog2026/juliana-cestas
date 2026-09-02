// Conteúdo de exemplo para a Home — pendente de catálogo real da Juliana.
// Fotos em public/images/produtos/ são reais (enviadas pelo cliente em 2026-09-02),
// mas nomes de produto, preços e vínculo foto->produto ainda são EXEMPLO para
// aprovação visual; nenhum dado real de estoque ou pagamento depende disto.

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  installments?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  image: string;
  categorySlug: string;
};

export type Category = {
  slug: string;
  name: string;
  image: string;
};

const p = (file: string) => `/images/produtos/${file}`;

export const categories: Category[] = [
  { slug: "cafe-da-manha", name: "Café da manhã", image: p("cesta-doce-manha.jpeg") },
  { slug: "romantico", name: "Românticas", image: p("cesta-romance-ao-amanhecer.jpeg") },
  { slug: "aniversario", name: "Aniversário", image: p("cesta-aniversario-especial.jpeg") },
  { slug: "corporativo", name: "Corporativo", image: p("cesta-presente-corporativo.jpeg") },
  { slug: "infantil", name: "Infantil", image: p("cesta-cafe-completo.png") },
  { slug: "cha-da-tarde", name: "Chá da tarde", image: p("cesta-cha-da-tarde.jpeg") },
];

export const featuredProducts: Product[] = [
  {
    id: "1",
    slug: "cesta-cafe-completo",
    name: "Cesta Café Completo",
    price: 189,
    installments: "em até 3x sem juros",
    rating: 4.9,
    reviewCount: 32,
    badge: "Mais pedida",
    image: p("cesta-cafe-completo.png"),
    categorySlug: "cafe-da-manha",
  },
  {
    id: "2",
    slug: "cesta-romance-ao-amanhecer",
    name: "Romance ao Amanhecer",
    price: 249,
    installments: "em até 4x sem juros",
    rating: 5,
    reviewCount: 18,
    image: p("cesta-romance-ao-amanhecer.jpeg"),
    categorySlug: "romantico",
  },
  {
    id: "3",
    slug: "cesta-doce-manha",
    name: "Doce Manhã",
    price: 159,
    compareAtPrice: 179,
    installments: "em até 3x sem juros",
    rating: 4.8,
    reviewCount: 41,
    badge: "Oferta",
    image: p("cesta-doce-manha.jpeg"),
    categorySlug: "cafe-da-manha",
  },
  {
    id: "4",
    slug: "cesta-presente-corporativo",
    name: "Presente Corporativo",
    price: 219,
    installments: "em até 4x sem juros",
    rating: 4.9,
    reviewCount: 12,
    image: p("cesta-presente-corporativo.jpeg"),
    categorySlug: "corporativo",
  },
  {
    id: "5",
    slug: "cesta-aniversario-especial",
    name: "Aniversário Especial",
    price: 199,
    installments: "em até 3x sem juros",
    rating: 4.7,
    reviewCount: 27,
    image: p("cesta-aniversario-especial.jpeg"),
    categorySlug: "aniversario",
  },
  {
    id: "6",
    slug: "cesta-cha-da-tarde",
    name: "Chá da Tarde",
    price: 169,
    installments: "em até 3x sem juros",
    rating: 5,
    reviewCount: 9,
    image: p("cesta-cha-da-tarde.jpeg"),
    categorySlug: "cha-da-tarde",
  },
];

export const collectionPresentes: Product[] = featuredProducts.filter(
  (item) => item.price <= 200
);

export const faqItems = [
  {
    question: "Qual o prazo para fazer minha encomenda?",
    answer:
      "Pedidos feitos até as 14h podem ser entregues no mesmo dia em algumas regiões de Brasília. Para datas específicas, recomendamos encomendar com 2 dias de antecedência.",
  },
  {
    question: "Como funciona o cartão personalizado?",
    answer:
      "Na página de cada cesta você escreve a mensagem e o nome de quem vai receber. O cartão sai impresso junto com o pedido, sem custo adicional.",
  },
  {
    question: "Quais as formas de pagamento?",
    answer:
      "Pix, cartão de crédito em até 4x sem juros e boleto. O pagamento é processado com segurança na hora do checkout.",
  },
  {
    question: "Vocês entregam em toda Brasília?",
    answer:
      "Sim, entregamos nas principais regiões administrativas. O frete e o prazo exato aparecem na página do produto assim que você informa o CEP.",
  },
  {
    question: "É possível personalizar os itens da cesta?",
    answer:
      "Várias cestas permitem trocar itens ou adicionar complementos na própria página do produto, antes de adicionar ao carrinho.",
  },
];

export const benefits = [
  {
    title: "Entrega em Brasília",
    description: "Mesmo dia em regiões selecionadas.",
    icon: "Truck" as const,
  },
  {
    title: "Pagamento seguro",
    description: "Pix, cartão e boleto protegidos.",
    icon: "ShieldCheck" as const,
  },
  {
    title: "Cartão personalizado",
    description: "Sua mensagem em cada cesta.",
    icon: "PenLine" as const,
  },
  {
    title: "Atendimento humano",
    description: "Dúvidas direto pelo WhatsApp.",
    icon: "Headset" as const,
  },
];
