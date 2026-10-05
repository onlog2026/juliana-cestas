/**
 * Soluções por situação do lojista, em forma de DADOS. `/solucoes` (índice) e
 * `/solucoes/[segmento]` leem esta lista; o site também importa `SOLUCOES` para menus e rodapé.
 * Mesmas regras de honestidade de `recursos.ts`: nada de número, cliente ou depoimento inventado.
 * `recursos` são slugs de `RECURSOS`.
 */

export type Solucao = {
  slug: string;
  titulo: string;
  resumo: string;
  /** Título do <title> (até 60 caracteres). */
  seoTitulo: string;
  /** Meta description (120 a 155 caracteres). */
  seoDescricao: string;
  heroTitulo: string;
  heroTexto: string;
  /** "Para quem é": frase curta usada no cartão do índice. */
  paraQuem: string;
  dores: Array<{ titulo: string; texto: string }>;
  ganhos: Array<{ titulo: string; texto: string }>;
  /** slugs de RECURSOS, na ordem em que devem aparecer. */
  recursos: string[];
  passos: Array<{ titulo: string; texto: string }>;
  faq: Array<{ pergunta: string; resposta: string }>;
  imagem: { src: string; alt: string; formato: "desktop" | "celular" };
};

export const SOLUCOES: Solucao[] = [
  {
    slug: "vendo-so-pelo-instagram",
    titulo: "Vendo só pelo Instagram",
    resumo: "Tire o pedido da conversa e leve para uma loja com data, frete e pagamento.",
    paraQuem: "Para quem recebe pedido por mensagem direta e anota tudo à mão.",
    seoTitulo: "Loja virtual para quem vende cestas só pelo Instagram",
    seoDescricao:
      "Saia do pedido por mensagem: tenha uma loja com carrinho, entrega com data e horário, PIX e painel de pedidos. Comece com 7 dias grátis.",
    heroTitulo: "Do direct do Instagram para uma loja de verdade",
    heroTexto:
      "Você continua divulgando no Instagram. O que muda é o fim da conversa: o cliente escolhe a cesta, a data e paga na loja, sem você digitar nada.",
    dores: [
      {
        titulo: "As mesmas perguntas todo dia",
        texto: "Preço, frete, se tem para amanhã. Responder cada pessoa consome horas que poderiam virar cesta pronta.",
      },
      {
        titulo: "Pedido anotado no caderno",
        texto: "Endereço num lugar, horário em outro e recado do cartão numa conversa. Qualquer descuido vira entrega errada.",
      },
      {
        titulo: "Conferir PIX comprovante por comprovante",
        texto: "Em dia de muita venda, achar quem pagou o quê é onde mais se erra.",
      },
    ],
    ganhos: [
      {
        titulo: "O link da bio vende por você",
        texto: "O cliente vê as cestas, os preços e os horários disponíveis sem esperar resposta.",
      },
      {
        titulo: "Pedido completo, sem digitar",
        texto: "Destinatário, endereço, data, horário e recado chegam organizados no painel.",
      },
      {
        titulo: "Pagamento conferido sozinho",
        texto: "PIX, cartão ou boleto na sua conta do Asaas, com o pedido marcado como pago quando confirmado.",
      },
    ],
    recursos: [
      "loja-online-e-modelos",
      "entrega-data-horario-frete",
      "pagamentos-pix-cartao-boleto",
      "cartao-de-mensagem",
      "app-no-celular",
    ],
    passos: [
      { titulo: "Crie a loja grátis", texto: "Escolha um modelo e cadastre suas cestas." },
      { titulo: "Configure entrega e pagamento", texto: "Horários, regiões e a sua conta do Asaas." },
      { titulo: "Coloque o link na bio", texto: "E nas respostas que você já manda." },
    ],
    faq: [
      {
        pergunta: "Vou perder meus clientes do Instagram?",
        resposta: "Não. O Instagram continua sendo a vitrine e a loja é onde o pedido é fechado.",
      },
      {
        pergunta: "Preciso de CNPJ para começar?",
        resposta:
          "Para testar, não. As exigências para receber pagamentos são as do Asaas, na sua conta, e valem as regras deles.",
      },
      {
        pergunta: "Dá para testar antes de pagar?",
        resposta: "Sim. São 7 dias grátis.",
      },
    ],
    imagem: {
      src: "/modelos/stories-claro-m.webp",
      alt: "Captura de uma loja no celular com visual de rede social, com círculos de categorias e feed de cestas.",
      formato: "celular",
    },
  },
  {
    slug: "ja-tenho-loja-virtual",
    titulo: "Já tenho loja virtual",
    resumo: "Troque uma loja genérica por uma feita para cestas e presentes, no seu ritmo.",
    paraQuem: "Para quem usa uma loja virtual comum e sente falta de data, horário e cartão.",
    seoTitulo: "Troque sua loja virtual por uma feita para cestas",
    seoDescricao:
      "Sua loja atual não pergunta data, horário nem recado do cartão? Veja como migrar para uma loja feita para cestas e presentes, com 7 dias grátis.",
    heroTitulo: "Uma loja que entende de presente, não só de produto",
    heroTexto:
      "Lojas genéricas tratam cesta como qualquer mercadoria. Aqui, data de entrega, horário, destinatário e cartão são parte da compra.",
    dores: [
      {
        titulo: "Campos que não existem",
        texto: "A loja comum não pergunta para quem é, quando entregar nem qual recado vai no cartão. Você pega isso por mensagem depois.",
      },
      {
        titulo: "Frete que não conversa com a sua entrega",
        texto: "Frete por peso não serve quando você entrega por região e por horário marcado.",
      },
      {
        titulo: "Medo de mudar e parar de vender",
        texto: "Trocar de loja parece arriscado quando as vendas vêm todos os dias.",
      },
    ],
    ganhos: [
      {
        titulo: "Compra pensada para presente",
        texto: "Cada cesta tem destinatário, endereço, data, horário e cartão próprios.",
      },
      {
        titulo: "Entrega por região e janela",
        texto: "Frete por CEP, capacidade por horário e dias bloqueados, do jeito que você já trabalha.",
      },
      {
        titulo: "Sem pressa para trocar",
        texto: "Com 7 dias grátis, você monta e testa a nova loja antes de apontar o seu endereço para ela.",
      },
    ],
    recursos: [
      "carrinho-varias-cestas",
      "entrega-data-horario-frete",
      "cartao-de-mensagem",
      "galeria-de-modelos",
      "loja-online-e-modelos",
    ],
    passos: [
      { titulo: "Monte a loja nova", texto: "Cadastre os produtos e escolha o modelo, com a antiga ainda no ar." },
      { titulo: "Teste um pedido de ponta a ponta", texto: "Do carrinho ao pagamento." },
      { titulo: "Aponte o seu domínio", texto: "O painel mostra o que configurar e confere se ficou certo." },
    ],
    faq: [
      {
        pergunta: "Vocês importam meus produtos da loja atual?",
        resposta: "Não há importação automática hoje. Os produtos são cadastrados pelo painel.",
      },
      {
        pergunta: "Posso manter o meu domínio?",
        resposta: "Sim. Você aponta o seu domínio para a nova loja quando estiver pronta.",
      },
      {
        pergunta: "E o meu histórico de pedidos?",
        resposta: "Ele fica na plataforma antiga. A nova loja começa a registrar a partir dos pedidos feitos nela.",
      },
    ],
    imagem: {
      src: "/modelos/boutique-premium-d.webp",
      alt: "Captura de um modelo de loja boutique no computador, com cestas e presentes em destaque.",
      formato: "desktop",
    },
  },
  {
    slug: "vendo-para-empresas",
    titulo: "Vendo para empresas",
    resumo: "Receba pedidos em quantidade, com pedido de orçamento e carrinho em formato de proposta.",
    paraQuem: "Para quem atende equipes e clientes de empresas e fecha por orçamento.",
    seoTitulo: "Loja para vender cestas a empresas com orçamento",
    seoDescricao:
      "Receba pedidos de empresas com formulário de orçamento, quantidade e data. Modelos de loja próprios para vendas corporativas. Teste 7 dias grátis.",
    heroTitulo: "Venda para empresas com um jeito profissional de pedir",
    heroTexto:
      "Quem compra para a empresa quer proposta, quantidade e prazo. A loja organiza esse pedido e entrega a você os dados prontos para responder.",
    dores: [
      {
        titulo: "Pedido grande chega bagunçado",
        texto: "Quantidade, data e empresa vêm picados em várias mensagens, e você precisa remontar a proposta.",
      },
      {
        titulo: "Carrinho comum não serve",
        texto: "Quem compra 40 unidades não quer pagar no mesmo fluxo de quem compra uma.",
      },
      {
        titulo: "Imagem amadora afasta o comprador",
        texto: "Compradores corporativos comparam fornecedores. Uma loja bem apresentada ajuda a ser levado a sério.",
      },
    ],
    ganhos: [
      {
        titulo: "Pedido de orçamento organizado",
        texto: "Nome, empresa, quantidade e data entram juntos; com WhatsApp cadastrado, a conversa abre com tudo preenchido.",
      },
      {
        titulo: "Modelos feitos para B2B",
        texto: "Há modelos que explicam o passo a passo da compra corporativa e apresentam o carrinho como orçamento.",
      },
      {
        titulo: "Condições são suas",
        texto: "As condições de preço por quantidade que aparecem na demonstração são exemplo; na sua loja, você define as suas.",
      },
    ],
    recursos: [
      "cestas-para-empresas",
      "galeria-de-modelos",
      "pagamentos-pix-cartao-boleto",
      "emails-automaticos",
      "integracao-bling",
    ],
    passos: [
      { titulo: "Escolha um modelo para empresas", texto: "Há variações corporativa, escritório e eventos." },
      { titulo: "Cadastre as cestas", texto: "Com o preço de partida de cada uma." },
      { titulo: "Responda cada orçamento", texto: "Combinando quantidade, prazo e condições." },
    ],
    faq: [
      {
        pergunta: "A loja fecha o pedido corporativo sozinha?",
        resposta: "O pedido de orçamento inicia a conversa; as condições finais você combina com a empresa.",
      },
      {
        pergunta: "Emite nota fiscal?",
        resposta: "Não. A integração com o Bling, que ajudaria nisso, ainda não está disponível.",
      },
      {
        pergunta: "Dá para ter também a venda comum na mesma loja?",
        resposta: "Dá. O modelo define o visual; você pode oferecer cestas para o público em geral também.",
      },
    ],
    imagem: {
      src: "/modelos/empresas-escritorio-d.webp",
      alt: "Captura de um modelo de loja para empresas em grafite e verde, no computador.",
      formato: "desktop",
    },
  },
  {
    slug: "floricultura",
    titulo: "Floricultura",
    resumo: "Entrega com hora marcada, cartão de mensagem e fotos que vendem arranjos e presentes.",
    paraQuem: "Para floriculturas e quem vende arranjos junto com presentes.",
    seoTitulo: "Loja virtual para floricultura com entrega agendada",
    seoDescricao:
      "Venda arranjos e cestas com entrega em data e hora marcadas, cartão de mensagem e PIX. Modelos de loja visuais para floricultura. 7 dias grátis.",
    heroTitulo: "Flor chega na hora certa quando a entrega é agendada",
    heroTexto:
      "Flor é presente de data marcada. A loja deixa o cliente escolher dia e janela, escrever o recado e pagar, tudo antes de você começar a montar.",
    dores: [
      {
        titulo: "Datas de pico lotam a agenda",
        texto: "Dia das Mães e Dia dos Namorados concentram pedidos. Sem limite de entregas por horário, é fácil prometer mais do que cabe.",
      },
      {
        titulo: "Recado errado estraga o presente",
        texto: "Nome trocado no cartão é o tipo de erro que o cliente não perdoa.",
      },
      {
        titulo: "Foto fraca não vende arranjo",
        texto: "Flor se vende pelo olho. Uma vitrine que mostra bem os arranjos faz diferença.",
      },
    ],
    ganhos: [
      {
        titulo: "Capacidade por janela",
        texto: "Você define quantas entregas cabem em cada horário, e a janela cheia some da escolha do cliente.",
      },
      {
        titulo: "Cartão preenchido pelo cliente",
        texto: "Para quem, de quem e a mensagem vão no pedido, com modelos para as principais datas.",
      },
      {
        titulo: "Vitrine que valoriza a foto",
        texto: "Modelos com fotos grandes e visual de boutique, como o de flores e presentes.",
      },
    ],
    recursos: [
      "entrega-data-horario-frete",
      "cartao-de-mensagem",
      "cupons-tarjas-promocoes",
      "avaliacoes-com-foto",
      "loja-online-e-modelos",
    ],
    passos: [
      { titulo: "Escolha um modelo visual", texto: "Como o boutique, com fotos grandes." },
      { titulo: "Defina horários e capacidade", texto: "Principalmente para as datas de pico." },
      { titulo: "Abra os pedidos", texto: "O cliente escolhe data, hora e recado." },
    ],
    faq: [
      {
        pergunta: "Posso vender só arranjo, sem cesta?",
        resposta: "Sim. Os produtos são os que você cadastra, e o nome da categoria é livre.",
      },
      {
        pergunta: "Dá para criar tarja de Dia das Mães?",
        resposta: "Sim. Já existe uma tarja com esse nome, e você pode ajustar texto e cores.",
      },
      {
        pergunta: "O cliente vê o frete antes de pagar?",
        resposta: "Sim, ao informar o CEP em uma região que você atende.",
      },
    ],
    imagem: {
      src: "/modelos/boutique-flores-m.webp",
      alt: "Captura de uma loja de flores e presentes no celular, com arranjos em destaque.",
      formato: "celular",
    },
  },
  {
    slug: "cafe-colonial-e-rustico",
    titulo: "Café colonial e cestas rústicas",
    resumo: "Uma vitrine acolhedora para cestas de café, produtos artesanais e Páscoa.",
    paraQuem: "Para quem vende café colonial, cestas de fazenda, queijos, doces e produtos artesanais.",
    seoTitulo: "Loja virtual para café colonial e cestas rústicas",
    seoDescricao:
      "Venda cestas de café colonial e produtos artesanais com um visual rústico e acolhedor, entrega agendada e pagamento por PIX. 7 dias grátis.",
    heroTitulo: "A mesa farta do café colonial, agora com pedido online",
    heroTexto:
      "Cestas artesanais pedem uma vitrine que passe cuidado. Há modelos rústicos prontos, e o pedido já chega com data, horário e recado.",
    dores: [
      {
        titulo: "Produto artesanal pede visual à altura",
        texto: "Uma loja fria e genérica não combina com um café colonial feito com carinho.",
      },
      {
        titulo: "Produção por encomenda",
        texto: "Quem faz sob pedido precisa saber a data antes de começar e ter antecedência para produzir.",
      },
      {
        titulo: "Datas especiais mudam tudo",
        texto: "Páscoa, Natal e Dia das Mães têm cestas próprias e demanda concentrada.",
      },
    ],
    ganhos: [
      {
        titulo: "Modelos rústicos",
        texto: "Há modelos como café colonial, fazenda e Páscoa, feitos para esse estilo de loja.",
      },
      {
        titulo: "Antecedência mínima",
        texto: "Você define com quantas horas de antecedência um pedido pode ser feito, para ter tempo de produzir.",
      },
      {
        titulo: "Adicionais e cartão",
        texto: "O cliente acrescenta itens extras à cesta e escreve o recado do presente.",
      },
    ],
    recursos: [
      "loja-online-e-modelos",
      "entrega-data-horario-frete",
      "cartao-de-mensagem",
      "estoque-e-compras",
      "cupons-tarjas-promocoes",
    ],
    passos: [
      { titulo: "Escolha o modelo rústico", texto: "Café colonial, fazenda ou Páscoa." },
      { titulo: "Cadastre as cestas e a antecedência", texto: "Conforme o seu tempo de produção." },
      { titulo: "Receba pedidos com data marcada", texto: "E produza com calma." },
    ],
    faq: [
      {
        pergunta: "Posso controlar o custo dos ingredientes?",
        resposta: "Sim, no módulo de estoque e compras, com custo médio e margem.",
      },
      {
        pergunta: "Dá para entregar só na minha região?",
        resposta: "Sim. Você cadastra as áreas atendidas e o cliente vê o frete pelo CEP.",
      },
      {
        pergunta: "Meu produto é perecível. Como evito atraso?",
        resposta: "Com horários, capacidade por janela e antecedência mínima configurados por você.",
      },
    ],
    imagem: {
      src: "/modelos/rustico-cafe-colonial-d.webp",
      alt: "Captura de um modelo de loja rústico para café colonial no computador.",
      formato: "desktop",
    },
  },
  {
    slug: "presentes-corporativos",
    titulo: "Presentes corporativos",
    resumo: "Brindes de fim de ano, datas e eventos para empresas, com visual sóbrio e orçamento.",
    paraQuem: "Para quem vende brindes e presentes de fim de ano, aniversário e eventos de empresa.",
    seoTitulo: "Loja de presentes corporativos com visual profissional",
    seoDescricao:
      "Venda brindes e cestas corporativas com modelos sóbrios, pedido de orçamento, entrega agendada e vários destinatários por pedido. Teste 7 dias grátis.",
    heroTitulo: "Presentes corporativos com cara de fornecedor sério",
    heroTexto:
      "Fim de ano, aniversário de cliente, evento de equipe. A loja ajuda a apresentar as opções e a organizar quem recebe o quê, e quando.",
    dores: [
      {
        titulo: "Muitos destinatários, um só pedido",
        texto: "A empresa quer mandar a mesma cesta para dezenas de pessoas, em endereços diferentes.",
      },
      {
        titulo: "Apresentação precisa passar confiança",
        texto: "O comprador corporativo julga o fornecedor pela forma como ele se apresenta.",
      },
      {
        titulo: "Prazo apertado em fim de ano",
        texto: "Dezembro concentra pedidos, e a janela de entrega define se você entrega ou não.",
      },
    ],
    ganhos: [
      {
        titulo: "Cada cesta, um destinatário",
        texto: "O carrinho aceita várias cestas com destinatário, endereço, data e cartão diferentes, em um só pagamento.",
      },
      {
        titulo: "Visual sóbrio",
        texto: "Modelos de aparência corporativa, como o escuro e sóbrio, ou o azul de empresas.",
      },
      {
        titulo: "Orçamento e datas controladas",
        texto: "Pedido de orçamento para volumes maiores e grade de entrega para controlar as datas de pico.",
      },
    ],
    recursos: [
      "cestas-para-empresas",
      "carrinho-varias-cestas",
      "cartao-de-mensagem",
      "entrega-data-horario-frete",
      "painel-e-relatorios",
    ],
    passos: [
      { titulo: "Escolha um modelo sóbrio", texto: "Corporativo, escritório ou eventos." },
      { titulo: "Monte as cestas e as condições", texto: "Com preço de partida e prazos." },
      { titulo: "Receba o pedido e organize as entregas", texto: "Tudo no painel, por data e horário." },
    ],
    faq: [
      {
        pergunta: "Dá para colocar a marca da empresa no cartão?",
        resposta: "Os cartões têm modelos por ocasião e texto livre. Não há personalização com o logo do cliente.",
      },
      {
        pergunta: "A empresa precisa de nota fiscal.",
        resposta: "A plataforma não emite nota. A integração com o Bling, para apoiar isso, ainda não está disponível.",
      },
      {
        pergunta: "Posso receber pedido para 50 endereços de uma vez?",
        resposta: "Cada endereço é uma cesta no carrinho. Para volumes muito grandes, o pedido de orçamento é o caminho mais prático.",
      },
    ],
    imagem: {
      src: "/modelos/noir-corporativo-d.webp",
      alt: "Captura de um modelo de loja escuro e sóbrio para presentes corporativos, no computador.",
      formato: "desktop",
    },
  },
];

export function getSolucao(slug: string): Solucao | undefined {
  return SOLUCOES.find((s) => s.slug === slug);
}
