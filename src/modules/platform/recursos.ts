/**
 * Serviços (recursos) da plataforma, em forma de DADOS. Uma única página dirigida por estes dados
 * (`/recursos/[servico]`) e o índice (`/recursos`) leem esta lista; o site também importa `RECURSOS`
 * para menus e rodapé.
 *
 * REGRAS DESTE ARQUIVO (briefing do site da plataforma):
 *  - só descreve o que existe hoje no código; o que ainda não existe tem `status: "em-breve"`;
 *  - nenhum preço, nenhuma quantidade de clientes, nenhum depoimento;
 *  - único número fixo permitido: 51 modelos de loja e 7 dias grátis;
 *  - imagens: capturas reais em `public/modelos/<modelo>-<variação>-{d,m}.webp`.
 */

export type RecursoStatus = "disponivel" | "em-breve";

export type Recurso = {
  slug: string;
  titulo: string;
  resumo: string;
  /** Nome de ícone do `lucide-react` (resolvido em `components/platform/servicos/icone.tsx`). */
  icone: string;
  status: RecursoStatus;
  /** Título do <title> (até 60 caracteres). */
  seoTitulo: string;
  /** Meta description (120 a 155 caracteres). */
  seoDescricao: string;
  heroTitulo: string;
  heroTexto: string;
  problema: { titulo: string; texto: string };
  beneficios: Array<{ titulo: string; texto: string }>;
  imagem: { src: string; alt: string; formato: "desktop" | "celular" };
  passos: Array<{ titulo: string; texto: string }>;
  faq: Array<{ pergunta: string; resposta: string }>;
  /** slugs de outros recursos */
  relacionados: string[];
  /** Aviso extra (usado nos "em breve"). */
  aviso?: string;
};

export const RECURSOS: Recurso[] = [
  {
    slug: "loja-online-e-modelos",
    titulo: "Loja online e modelos",
    resumo: "Uma loja pronta para vender cestas e presentes, com o visual de um modelo que você escolhe.",
    icone: "Store",
    status: "disponivel",
    seoTitulo: "Loja online para cestas e presentes, pronta para vender",
    seoDescricao:
      "Crie a loja virtual da sua cesteria com produtos, categorias, banners e domínio próprio. Escolha um modelo e comece com 7 dias grátis.",
    heroTitulo: "Sua loja de cestas no ar, com a cara da sua marca",
    heroTexto:
      "Você cadastra os produtos, escolhe um modelo e coloca o seu logo. A loja já nasce com carrinho, entrega com data e horário, pagamento e painel de pedidos.",
    problema: {
      titulo: "Vender só por mensagem cansa e perde pedido",
      texto:
        "Quem vende pelo Instagram responde as mesmas perguntas o dia todo: quanto custa, tem para amanhã, qual o frete. Cliente que não recebe resposta rápida compra de outro lugar.",
    },
    beneficios: [
      {
        titulo: "Produtos, categorias e banners",
        texto:
          "Cadastre cada cesta com fotos, preço, descrição e adicionais. Organize em categorias e destaque o que quiser na página inicial.",
      },
      {
        titulo: "Modelo trocável",
        texto:
          "O visual vem de um modelo de loja. Se mudar de ideia, troque de modelo sem refazer o cadastro dos produtos.",
      },
      {
        titulo: "Endereço próprio",
        texto:
          "Você pode usar o seu próprio domínio. O painel mostra o passo a passo do que configurar e confere se o apontamento está correto.",
      },
    ],
    imagem: {
      src: "/modelos/classica-cafe-d.webp",
      alt: "Captura de uma loja de cestas de café da manhã no computador, com banner, categorias e cestas em destaque.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Crie a conta", texto: "Informe os dados da loja e comece os 7 dias grátis." },
      { titulo: "Escolha o modelo e cadastre as cestas", texto: "Selecione o visual, suba as fotos e defina preços." },
      { titulo: "Divulgue o endereço", texto: "Coloque o link da loja na bio do Instagram e nas conversas." },
    ],
    faq: [
      {
        pergunta: "Preciso saber programar?",
        resposta: "Não. Tudo é feito pelo painel, com campos e botões. Você não mexe em código.",
      },
      {
        pergunta: "Posso usar meu próprio domínio?",
        resposta:
          "Sim. No painel você informa o domínio e vê quais registros configurar no provedor onde ele foi comprado. A plataforma confere se o apontamento está certo.",
      },
      {
        pergunta: "Posso trocar o modelo depois?",
        resposta:
          "Pode. Os produtos e pedidos ficam como estão; muda só o visual. Alguns modelos são dos planos Pro e Premium.",
      },
      {
        pergunta: "Como começo?",
        resposta: "Criando a loja grátis. São 7 dias para testar antes de escolher um plano.",
      },
    ],
    relacionados: ["galeria-de-modelos", "carrinho-varias-cestas", "app-no-celular"],
  },
  {
    slug: "carrinho-varias-cestas",
    titulo: "Carrinho com várias cestas",
    resumo: "O cliente monta um pedido com várias cestas, cada uma para uma pessoa, data e endereço.",
    icone: "ShoppingBasket",
    status: "disponivel",
    seoTitulo: "Carrinho com várias cestas, cada uma para um destinatário",
    seoDescricao:
      "O cliente compra várias cestas em um só pedido, cada uma com destinatário, data, horário e cartão próprios. Veja como funciona o carrinho da loja.",
    heroTitulo: "Várias cestas em um pedido, cada uma para uma pessoa",
    heroTexto:
      "Presente raramente é uma cesta só. O carrinho deixa o cliente mandar cestas diferentes para pessoas diferentes e pagar tudo de uma vez.",
    problema: {
      titulo: "Pedido com três presentes vira três conversas",
      texto:
        "Quando o cliente quer presentear a mãe, a sogra e a madrinha, a conversa de mensagem vira bagunça: três endereços, três horários, três recados. É aí que o erro acontece.",
    },
    beneficios: [
      {
        titulo: "Cada cesta com seus dados",
        texto:
          "Cada item do carrinho tem o seu próprio destinatário, telefone, endereço, data, horário e cartão de mensagem.",
      },
      {
        titulo: "Uma compra, um pagamento",
        texto: "O comprador informa os próprios dados uma vez só e finaliza todas as cestas juntas.",
      },
      {
        titulo: "Adicionais e sugestões",
        texto:
          "O cliente pode acrescentar adicionais à cesta, como vinho, balão ou foto, e a quantidade de cada um entra no valor.",
      },
    ],
    imagem: {
      src: "/modelos/stories-claro-m.webp",
      alt: "Captura de uma loja de cestas no celular, com a barra de compra e as cestas em formato de feed.",
      formato: "celular",
    },
    passos: [
      { titulo: "Escolhe a cesta", texto: "O cliente abre a cesta e toca em adicionar." },
      { titulo: "Preenche os dados do presente", texto: "Quem recebe, onde, quando e qual mensagem." },
      { titulo: "Repete ou finaliza", texto: "Adiciona outras cestas ou paga tudo de uma vez." },
    ],
    faq: [
      {
        pergunta: "Cada cesta pode ir para um endereço diferente?",
        resposta: "Sim. Endereço, data, horário e cartão são definidos por cesta, não pelo pedido inteiro.",
      },
      {
        pergunta: "O valor é conferido no servidor?",
        resposta:
          "Sim. O que aparece na tela é uma estimativa; na hora de finalizar, o valor é recalculado pela loja, para ninguém pagar um preço errado.",
      },
      {
        pergunta: "O cliente precisa criar conta?",
        resposta: "O carrinho pede os dados do comprador na finalização. Não é preciso cadastro prévio para comprar.",
      },
    ],
    relacionados: ["entrega-data-horario-frete", "cartao-de-mensagem", "pagamentos-pix-cartao-boleto"],
  },
  {
    slug: "entrega-data-horario-frete",
    titulo: "Entrega: data, horário e frete por CEP",
    resumo: "O cliente escolhe o dia e o horário; o frete é calculado pelo CEP.",
    icone: "Truck",
    status: "disponivel",
    seoTitulo: "Entrega com data, horário e frete por CEP para cestas",
    seoDescricao:
      "Defina horários de entrega, antecedência, capacidade e zonas por CEP. O cliente escolhe o dia e a hora e vê o frete antes de pagar.",
    heroTitulo: "Entrega no dia e na hora que o cliente escolheu",
    heroTexto:
      "Você define os horários que atende e as regiões que entrega. O cliente escolhe a data, informa o CEP e vê o frete antes de pagar.",
    problema: {
      titulo: "Combinar horário por mensagem não escala",
      texto:
        "Em datas como Dia das Mães, o número de entregas explode. Sem uma grade, você aceita mais pedidos do que consegue entregar e promete horários que não cumpre.",
    },
    beneficios: [
      {
        titulo: "Grade de horários sua",
        texto:
          "Configure o horário de funcionamento de cada dia, a duração de cada janela, a antecedência mínima, os dias fechados e quantas entregas cabem por janela.",
      },
      {
        titulo: "Frete por região",
        texto:
          "Cadastre as áreas que você atende, com taxa e prazo. O cliente digita o CEP e a loja identifica a região e o valor.",
      },
      {
        titulo: "Retirada na loja",
        texto: "O cliente pode optar por retirar o pedido, quando você oferecer essa opção.",
      },
    ],
    imagem: {
      src: "/modelos/bairro-verde-whatsapp-d.webp",
      alt: "Captura de uma loja local no computador, com informações de entrega por região e horários.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Defina horários e regiões", texto: "No painel, em Entregas e Frete." },
      { titulo: "O cliente escolhe o dia", texto: "Só aparecem os horários que ainda têm vaga e respeitam a antecedência." },
      { titulo: "Você entrega e avisa", texto: "O pedido chega no painel com data, horário e endereço." },
    ],
    faq: [
      {
        pergunta: "Entregam para o Brasil todo?",
        resposta:
          "A entrega com fechamento automático é para as regiões que você cadastra. Para produtos que podem ser enviados por transportadora, a loja mostra a cotação, mas o fechamento desses pedidos ainda é combinado por WhatsApp.",
      },
      {
        pergunta: "Como evito aceitar pedido demais?",
        resposta:
          "Definindo a capacidade por janela de horário. Quando a janela enche, ela deixa de aparecer para o cliente.",
      },
      {
        pergunta: "Posso bloquear datas?",
        resposta: "Sim. Você marca os dias em que não entrega, como feriados, e eles somem da escolha do cliente.",
      },
    ],
    relacionados: ["carrinho-varias-cestas", "emails-automaticos", "painel-e-relatorios"],
  },
  {
    slug: "cartao-de-mensagem",
    titulo: "Cartão de mensagem",
    resumo: "O cliente escreve o recado e escolhe o modelo do cartãozinho que vai junto com a cesta.",
    icone: "Heart",
    status: "disponivel",
    seoTitulo: "Cartão de mensagem personalizado para cestas de presente",
    seoDescricao:
      "O cliente escolhe o modelo do cartão, escreve o recado e quem envia. Aniversário, Natal, Dia das Mães e outras datas, direto na compra.",
    heroTitulo: "O recado certo, junto com a cesta",
    heroTexto:
      "Na hora da compra, o cliente escolhe um modelo de cartão para a ocasião, escreve para quem é e assina. Você recebe tudo pronto no pedido.",
    problema: {
      titulo: "Recado por mensagem se perde",
      texto:
        "Quando o texto do cartão vem solto numa conversa, é fácil trocar nomes, esquecer um pedido ou digitar errado na hora de imprimir.",
    },
    beneficios: [
      {
        titulo: "Modelos por ocasião",
        texto:
          "Há modelos para aniversário, bodas, Natal, Páscoa, Dia das Mães, Dia dos Pais, filhos, réveillon e namorados. Você escolhe quais deixar disponíveis.",
      },
      {
        titulo: "Para quem e de quem",
        texto: "O cliente preenche o nome de quem recebe, o nome de quem envia e a mensagem.",
      },
      {
        titulo: "Dentro do pedido",
        texto: "O texto vai junto com a cesta no pedido, sem depender de mensagem à parte.",
      },
    ],
    imagem: {
      src: "/modelos/festa-aniversario-m.webp",
      alt: "Captura de uma loja de cestas de aniversário no celular, com cestas coloridas em destaque.",
      formato: "celular",
    },
    passos: [
      { titulo: "Cliente escolhe o modelo", texto: "Entre os que você deixou ativos." },
      { titulo: "Escreve o recado", texto: "E informa quem recebe e quem envia." },
      { titulo: "Você prepara e envia", texto: "O cartão vem no pedido, pronto para acompanhar a cesta." },
    ],
    faq: [
      {
        pergunta: "Posso escolher quais modelos aparecem?",
        resposta: "Sim. Você deixa disponíveis apenas os que fazem sentido para a sua loja.",
      },
      {
        pergunta: "O cartão é cobrado à parte?",
        resposta: "Isso é você quem decide. A plataforma não cobra do seu cliente nada além do que você configurar.",
      },
      {
        pergunta: "Cada cesta do pedido pode ter um recado diferente?",
        resposta: "Sim. O cartão é preenchido por cesta no carrinho.",
      },
    ],
    relacionados: ["carrinho-varias-cestas", "entrega-data-horario-frete", "avaliacoes-com-foto"],
  },
  {
    slug: "pagamentos-pix-cartao-boleto",
    titulo: "Pagamentos: PIX, cartão e boleto",
    resumo: "O cliente paga por PIX, cartão ou boleto, direto na sua conta no Asaas.",
    icone: "CreditCard",
    status: "disponivel",
    seoTitulo: "Receba por PIX, cartão e boleto na sua conta Asaas",
    seoDescricao:
      "A loja cobra por PIX, cartão de crédito ou boleto usando a sua conta no Asaas. O dinheiro vai para você, e o pedido é marcado como pago sozinho.",
    heroTitulo: "O pagamento cai na sua conta, não na nossa",
    heroTexto:
      "Você conecta a sua conta do Asaas à loja. O cliente paga por PIX, cartão ou boleto e o pedido é atualizado quando o pagamento é confirmado.",
    problema: {
      titulo: "Conferir comprovante um por um toma o dia",
      texto:
        "Receber PIX por mensagem obriga você a abrir o banco, procurar o valor e lembrar de quem é. Em dia de muito pedido, é onde mais se erra.",
    },
    beneficios: [
      {
        titulo: "Três formas de pagar",
        texto: "O cliente escolhe entre PIX (com QR e copia e cola), cartão de crédito e boleto.",
      },
      {
        titulo: "Conta do lojista",
        texto:
          "A cobrança é feita na sua conta do Asaas, com a sua chave. A plataforma não segura o seu dinheiro.",
      },
      {
        titulo: "Valor sempre conferido",
        texto: "O valor cobrado é sempre recalculado a partir do pedido gravado, nunca do que veio do navegador.",
      },
    ],
    imagem: {
      src: "/modelos/mercado-atacado-d.webp",
      alt: "Captura de uma loja no computador, com cestas em grade e preços visíveis.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Conecte sua conta Asaas", texto: "No painel, em Pagamentos, informe a sua chave." },
      { titulo: "O cliente finaliza e paga", texto: "Escolhe PIX, cartão ou boleto." },
      { titulo: "O pedido muda para pago", texto: "Quando o Asaas confirma, o painel e o cliente são avisados." },
    ],
    faq: [
      {
        pergunta: "Preciso ter conta no Asaas?",
        resposta:
          "Sim. A cobrança é emitida na sua conta. As taxas e os prazos de repasse são os do Asaas, definidos no seu contrato com eles.",
      },
      {
        pergunta: "Existe valor mínimo?",
        resposta: "O Asaas recusa cobranças abaixo de um valor mínimo, e a loja respeita essa regra do Asaas.",
      },
      {
        pergunta: "E se o cliente pagar e o pedido não mudar de status?",
        resposta:
          "Você pode marcar o pagamento à mão pelo painel. Se isso acontecer com frequência, o problema é a conexão com o Asaas, e vale revisar a chave.",
      },
    ],
    relacionados: ["carrinho-varias-cestas", "emails-automaticos", "painel-e-relatorios"],
  },
  {
    slug: "avaliacoes-com-foto",
    titulo: "Avaliações com foto da entrega",
    resumo: "Depois da entrega, o cliente avalia e pode enviar a foto da cesta recebida, com autorização.",
    icone: "Star",
    status: "disponivel",
    seoTitulo: "Avaliações de clientes com foto da cesta entregue",
    seoDescricao:
      "Convide o cliente a avaliar depois da entrega e a enviar a foto da cesta. Você aprova o que aparece na loja e ganha prova social real.",
    heroTitulo: "Quem recebeu a cesta mostra como ficou",
    heroTexto:
      "Depois da entrega, a loja convida o cliente a avaliar. Ele pode mandar uma foto, autorizando o uso. Você decide o que vai para a vitrine.",
    problema: {
      titulo: "Elogio no WhatsApp não vira venda",
      texto:
        "Os melhores comentários chegam em conversas privadas e ali ficam. Quem visita sua loja pela primeira vez não vê nada disso.",
    },
    beneficios: [
      {
        titulo: "Convite automático",
        texto: "Um e-mail de pesquisa convida o cliente a avaliar o pedido, com link próprio e seguro.",
      },
      {
        titulo: "Foto com autorização",
        texto: "A foto da entrega só é enviada com o consentimento de quem a manda.",
      },
      {
        titulo: "Você aprova antes de publicar",
        texto: "Cada avaliação fica pendente até você aprovar ou recusar no painel.",
      },
    ],
    imagem: {
      src: "/modelos/boutique-flores-d.webp",
      alt: "Captura de uma loja de flores e presentes no computador, com arranjos fotografados.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Pedido entregue", texto: "Você marca como entregue no painel." },
      { titulo: "Cliente recebe o convite", texto: "Por e-mail, com um link para avaliar." },
      { titulo: "Você aprova", texto: "A avaliação aprovada aparece na loja." },
    ],
    faq: [
      {
        pergunta: "Posso apagar uma avaliação ruim?",
        resposta:
          "Você pode recusar a publicação no painel. Recomendamos responder o cliente em vez de esconder: avaliação honesta passa confiança.",
      },
      {
        pergunta: "A nota aparece no Google?",
        resposta:
          "A loja só publica dados estruturados de avaliação quando existem avaliações reais aprovadas. Se não há, nada é inventado.",
      },
      {
        pergunta: "A foto é obrigatória?",
        resposta: "Não. O cliente pode avaliar sem foto.",
      },
    ],
    relacionados: ["emails-automaticos", "seo-e-google", "painel-e-relatorios"],
  },
  {
    slug: "estoque-e-compras",
    titulo: "Estoque e compras",
    resumo: "Controle entradas, saídas e perdas, com custo médio e margem calculados.",
    icone: "Boxes",
    status: "disponivel",
    seoTitulo: "Controle de estoque e compras para quem monta cestas",
    seoDescricao:
      "Registre entradas, saídas, ajustes e perdas dos itens da cesta. Veja custo médio e margem de cada produto, e saiba o que falta comprar.",
    heroTitulo: "Saiba o que tem no estoque e quanto cada cesta rende",
    heroTexto:
      "Registre o que entra e o que sai. A loja calcula o custo médio dos itens e mostra a margem de cada produto, avisando quando falta custo cadastrado.",
    problema: {
      titulo: "Margem no chute é prejuízo escondido",
      texto:
        "Sem custo médio por item, você não sabe se a cesta que mais vende é a que mais dá lucro. E sem controle de entrada e perda, o estoque da planilha nunca bate.",
    },
    beneficios: [
      {
        titulo: "Movimentações claras",
        texto: "Entrada, saída, ajuste e perda ficam registrados, cada um com seu nome na tela.",
      },
      {
        titulo: "Custo médio ponderado",
        texto: "Cada compra atualiza o custo médio do item. A margem de cada produto é calculada em cima dele.",
      },
      {
        titulo: "Sem número de mentira",
        texto:
          "Produto sem custo cadastrado não entra na conta de margem. A tela diz quantos produtos estão sem custo em vez de mostrar um total enganoso.",
      },
    ],
    imagem: {
      src: "/modelos/mercado-datas-d.webp",
      alt: "Captura de uma loja de cestas para datas comemorativas no computador, com cestas em grade.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Cadastre os itens", texto: "Informe o que compõe suas cestas." },
      { titulo: "Registre as compras", texto: "O custo médio se atualiza a cada entrada." },
      { titulo: "Acompanhe a margem", texto: "Veja no painel o que dá mais retorno." },
    ],
    faq: [
      {
        pergunta: "O estoque baixa sozinho quando vendo?",
        resposta:
          "Os movimentos de saída ficam registrados no estoque. Confira, ao começar, as opções do painel para a sua loja.",
      },
      {
        pergunta: "Preciso usar este módulo?",
        resposta: "Não. Você pode vender sem controlar estoque e ligar o controle quando quiser.",
      },
      {
        pergunta: "Dá para ver o que falta comprar?",
        resposta: "O painel tem a área de compras para você registrar o que adquiriu e acompanhar o custo.",
      },
    ],
    relacionados: ["painel-e-relatorios", "cupons-tarjas-promocoes", "integracao-bling"],
  },
  {
    slug: "emails-automaticos",
    titulo: "E-mails automáticos",
    resumo: "Pedido, pagamento, saída para entrega, entrega e pesquisa: o cliente é avisado sem você digitar.",
    icone: "Mail",
    status: "disponivel",
    seoTitulo: "E-mails automáticos de pedido, pagamento e entrega",
    seoDescricao:
      "O cliente recebe e-mails de pedido recebido, pagamento confirmado, saída para entrega, entrega e pesquisa. Você também é avisado de cada pedido novo.",
    heroTitulo: "O cliente sempre sabe em que pé está o pedido",
    heroTexto:
      "A loja envia os avisos importantes sozinha, com a sua marca. Você deixa de responder a pergunta mais comum: cadê o meu pedido?",
    problema: {
      titulo: "Cliente sem aviso manda mensagem",
      texto:
        "Quem não sabe se o pedido foi aceito, pago ou despachado pergunta. Cada pergunta tira você da produção.",
    },
    beneficios: [
      {
        titulo: "Do pedido à entrega",
        texto:
          "Há e-mails para pedido recebido, pedido confirmado, pagamento confirmado, saiu para entrega e entregue.",
      },
      {
        titulo: "Aviso para a loja",
        texto: "Você também recebe um e-mail a cada pedido novo.",
      },
      {
        titulo: "Pesquisa e lembrete",
        texto:
          "Depois da entrega, o cliente recebe o convite de avaliação. Pedidos que ficaram aguardando pagamento recebem um lembrete.",
      },
    ],
    imagem: {
      src: "/modelos/classica-romantica-m.webp",
      alt: "Captura de uma loja de cestas românticas no celular.",
      formato: "celular",
    },
    passos: [
      { titulo: "Cliente faz o pedido", texto: "E recebe o e-mail de recebimento." },
      { titulo: "Você atualiza o status", texto: "Pago, saiu para entrega, entregue." },
      { titulo: "Os avisos saem sozinhos", texto: "Cada mudança de status dispara o e-mail certo." },
    ],
    faq: [
      {
        pergunta: "O e-mail sai com a minha marca?",
        resposta: "Sim. As cores e o logo seguem a identidade da sua loja.",
      },
      {
        pergunta: "Pode mandar o mesmo aviso duas vezes?",
        resposta: "Não. Os avisos são protegidos contra repetição: se já foi enviado para aquele pedido, não sai de novo.",
      },
      {
        pergunta: "Tem aviso por WhatsApp?",
        resposta:
          "O que a plataforma entrega hoje, de forma automática, é o e-mail. Não prometemos aviso automático por WhatsApp.",
      },
    ],
    relacionados: ["avaliacoes-com-foto", "recuperacao-de-carrinho", "entrega-data-horario-frete"],
  },
  {
    slug: "cupons-tarjas-promocoes",
    titulo: "Cupons, tarjas e promoções",
    resumo: "Cupons de desconto, preço riscado e tarjas como Promoção e Black Friday.",
    icone: "Ticket",
    status: "disponivel",
    seoTitulo: "Cupons de desconto, tarjas e promoções para a sua loja",
    seoDescricao:
      "Crie cupons de percentual, valor fixo ou frete grátis, com limites de uso, e destaque ofertas com preço riscado e tarjas como Promoção e Black Friday.",
    heroTitulo: "Promoção clara, desconto sob controle",
    heroTexto:
      "Crie cupons com regras e destaque os produtos em oferta na vitrine, com preço antigo riscado e tarja colorida.",
    problema: {
      titulo: "Desconto dado no improviso corrói a margem",
      texto:
        "Prometer desconto por mensagem não deixa rastro: você não sabe quantas vezes foi usado, nem se o cliente usou duas vezes.",
    },
    beneficios: [
      {
        titulo: "Cupons com regra",
        texto:
          "Desconto em percentual, valor fixo ou frete grátis. Dá para definir valor mínimo de compra e limite de uso total e por cliente.",
      },
      {
        titulo: "Preço de e por",
        texto: "Informe o preço antigo e a loja mostra o riscado e o percentual de desconto, só quando o preço antigo é maior.",
      },
      {
        titulo: "Tarjas editáveis",
        texto:
          "Já vêm modelos como Promoção, Black Friday, Dia das Mães, Novo e Últimas unidades. Você muda os nomes e as cores.",
      },
    ],
    imagem: {
      src: "/modelos/promo-dia-das-maes-d.webp",
      alt: "Captura de uma loja em campanha de Dia das Mães no computador, com selos de desconto.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Crie o cupom", texto: "Defina tipo, valor, validade e limites." },
      { titulo: "Marque os produtos em oferta", texto: "Preço antigo e tarja." },
      { titulo: "Divulgue o código", texto: "O desconto é conferido na finalização." },
    ],
    faq: [
      {
        pergunta: "O cliente consegue usar o cupom mais vezes que o limite?",
        resposta: "Não. Validade, valor mínimo e limites são conferidos no servidor, não no navegador.",
      },
      {
        pergunta: "A tarja de desconto aparece sozinha?",
        resposta: "Só quando existe preço antigo maior que o atual. Sem isso, nenhum desconto é exibido.",
      },
      {
        pergunta: "Posso criar minhas próprias tarjas?",
        resposta: "Você edita as que já existem: nome e cores.",
      },
    ],
    relacionados: ["pagamentos-pix-cartao-boleto", "painel-e-relatorios", "loja-online-e-modelos"],
  },
  {
    slug: "seo-e-google",
    titulo: "SEO e Google",
    resumo: "Títulos, descrições, mapa do site e Google Analytics 4 para ser encontrado e medir resultado.",
    icone: "Search",
    status: "disponivel",
    seoTitulo: "SEO e Google Analytics 4 para a sua loja de cestas",
    seoDescricao:
      "Título e descrição por página, mapa do site, dados estruturados reais e Google Analytics 4. Seja encontrado no Google e saiba de onde vêm as vendas.",
    heroTitulo: "Seja encontrado por quem procura uma cesta",
    heroTexto:
      "A loja cuida do básico técnico de busca e deixa você ajustar os textos. E você liga o Google Analytics 4 colando o seu código de medição.",
    problema: {
      titulo: "Loja que o Google não entende não aparece",
      texto:
        "Quem vende só por rede social depende do algoritmo. Sem páginas indexáveis, ninguém que procura uma cesta de café da manhã na sua cidade encontra você.",
    },
    beneficios: [
      {
        titulo: "Textos de busca editáveis",
        texto: "Defina o título e a descrição que aparecem no Google para as suas páginas.",
      },
      {
        titulo: "Mapa do site e dados estruturados",
        texto:
          "A loja publica o mapa do site e dados estruturados. Avaliação só entra nos dados quando existem avaliações reais aprovadas.",
      },
      {
        titulo: "Google Analytics 4",
        texto: "Cole o ID de medição (começa com G-) nas configurações para acompanhar visitas e compras.",
      },
    ],
    imagem: {
      src: "/modelos/revista-gastronomia-d.webp",
      alt: "Captura de uma loja com visual de revista gastronômica no computador.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Preencha os textos", texto: "Título e descrição das páginas principais." },
      { titulo: "Cole o ID do Analytics", texto: "Nas configurações da loja." },
      { titulo: "Envie o mapa ao Google", texto: "No Google Search Console, usando o endereço do mapa do site." },
    ],
    faq: [
      {
        pergunta: "A plataforma conecta o Search Console para mim?",
        resposta:
          "Não. Você cria a sua conta no Google Search Console e envia o mapa do site. A loja deixa o mapa pronto.",
      },
      {
        pergunta: "Isso garante primeiro lugar no Google?",
        resposta: "Nada garante posição. A loja faz o básico técnico direito; o resultado depende também do seu conteúdo e da concorrência.",
      },
      {
        pergunta: "Preciso do Analytics?",
        resposta: "Não é obrigatório. Sem o ID, nada é medido.",
      },
    ],
    relacionados: ["avaliacoes-com-foto", "loja-online-e-modelos", "painel-e-relatorios"],
  },
  {
    slug: "app-no-celular",
    titulo: "App no celular",
    resumo: "O cliente instala a loja na tela inicial e abre como um aplicativo.",
    icone: "Smartphone",
    status: "disponivel",
    seoTitulo: "Sua loja vira aplicativo na tela inicial do celular",
    seoDescricao:
      "O cliente instala a sua loja na tela inicial do celular e abre sem a barra do navegador, com o seu ícone e as suas cores. Sem baixar nada em loja de apps.",
    heroTitulo: "A sua loja na tela inicial do cliente",
    heroTexto:
      "Quem compra com frequência pode instalar a loja no celular. Ela abre como um aplicativo, com o seu ícone e as suas cores.",
    problema: {
      titulo: "Cliente esquece o link",
      texto:
        "Quem comprou uma vez e gostou precisa lembrar o endereço ou rolar o Instagram para achar você. Isso derruba a recompra.",
    },
    beneficios: [
      {
        titulo: "Ícone na tela inicial",
        texto: "A loja usa o seu ícone e o nome da sua marca ao ser instalada.",
      },
      {
        titulo: "Abre sem barra de navegador",
        texto: "A barra de status do celular acompanha a cor do modelo da loja.",
      },
      {
        titulo: "Sem loja de aplicativos",
        texto: "Não precisa publicar nada na Play Store ou na App Store. O cliente instala pelo navegador.",
      },
    ],
    imagem: {
      src: "/modelos/stories-pastel-m.webp",
      alt: "Captura de uma loja com visual de aplicativo no celular, em tons pastel.",
      formato: "celular",
    },
    passos: [
      { titulo: "Cliente abre a loja no celular", texto: "No navegador." },
      { titulo: "Toca em instalar", texto: "No Chrome, menu e Instalar app. No iPhone, Compartilhar e Adicionar à Tela de Início." },
      { titulo: "Abre pelo ícone", texto: "Como qualquer aplicativo." },
    ],
    faq: [
      {
        pergunta: "Funciona sem internet?",
        resposta: "Não. A loja instalada precisa de conexão, e isso também evita que o cliente fique preso numa versão velha.",
      },
      {
        pergunta: "Está nas lojas de aplicativos?",
        resposta: "Não. A instalação é feita pelo navegador do celular.",
      },
      {
        pergunta: "Tenho que pagar à parte?",
        resposta: "Consulte a página de planos para ver o que cada plano inclui.",
      },
    ],
    relacionados: ["loja-online-e-modelos", "galeria-de-modelos", "carrinho-varias-cestas"],
  },
  {
    slug: "painel-e-relatorios",
    titulo: "Painel e relatórios",
    resumo: "Pedidos, entregas, finanças, produtos e atendimento em um só painel.",
    icone: "LayoutDashboard",
    status: "disponivel",
    seoTitulo: "Painel de pedidos, entregas e finanças da sua loja",
    seoDescricao:
      "Gerencie pedidos, produtos, entregas, finanças, avaliações, estoque e atendimento no mesmo painel, com a sua equipe e um acesso para cada pessoa.",
    heroTitulo: "Tudo da loja em um painel só",
    heroTexto:
      "Pedidos novos, entregas do dia, produtos, avaliações e finanças. Você enxerga o que precisa fazer hoje sem abrir dez conversas.",
    problema: {
      titulo: "Informação espalhada atrasa a entrega",
      texto:
        "Pedido numa conversa, data num caderno, pagamento no banco. Quando tudo está em lugares diferentes, algo sempre fica para trás.",
    },
    beneficios: [
      {
        titulo: "Pedidos e entregas",
        texto: "Veja cada pedido com destinatário, data, horário, endereço e status, e atualize em um clique.",
      },
      {
        titulo: "Financeiro",
        texto: "Acompanhe as vendas e extraia os dados do período para conferir ou enviar à contabilidade.",
      },
      {
        titulo: "Equipe e atendimento",
        texto: "Convide pessoas da equipe e acompanhe os chamados de suporte no próprio painel.",
      },
    ],
    imagem: {
      src: "/modelos/noir-corporativo-d.webp",
      alt: "Captura de uma loja de visual escuro e sóbrio no computador, com cestas corporativas.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Entre no painel", texto: "Com o e-mail e a senha da sua loja." },
      { titulo: "Veja o que há para fazer hoje", texto: "Pedidos novos e entregas." },
      { titulo: "Atualize e acompanhe", texto: "Cada mudança de status avisa o cliente." },
    ],
    faq: [
      {
        pergunta: "Funciona no celular?",
        resposta: "Sim, o painel é acessado pelo navegador, no computador ou no celular.",
      },
      {
        pergunta: "Posso dar acesso a funcionários?",
        resposta: "Sim. O painel tem a área de equipe, com acesso individual para cada pessoa.",
      },
      {
        pergunta: "Os relatórios mostram números de outras lojas?",
        resposta: "Não. Cada loja só enxerga os próprios dados.",
      },
    ],
    relacionados: ["estoque-e-compras", "emails-automaticos", "pagamentos-pix-cartao-boleto"],
  },
  {
    slug: "galeria-de-modelos",
    titulo: "Galeria de 51 modelos",
    resumo: "51 modelos de loja, cada um com variações de cor, para você ver pronto antes de escolher.",
    icone: "LayoutGrid",
    status: "disponivel",
    seoTitulo: "Galeria com 51 modelos de loja para cestas e presentes",
    seoDescricao:
      "Veja 51 modelos de loja para cestas e presentes, com versões para computador e celular e uma loja de demonstração para testar antes de escolher.",
    heroTitulo: "51 modelos para você escolher a cara da sua loja",
    heroTexto:
      "Do clássico ao editorial, do luxo ao promocional. Cada modelo tem uma loja de demonstração que você abre e navega antes de decidir.",
    problema: {
      titulo: "Escolher no escuro dá arrependimento",
      texto:
        "Ver só uma imagem não mostra como é navegar, escolher uma cesta e chegar ao carrinho. Quem decide sem testar costuma trocar depois.",
    },
    beneficios: [
      {
        titulo: "Demonstração navegável",
        texto: "Cada variação tem uma loja de exemplo com categorias, cestas e carrinho funcionando como demonstração.",
      },
      {
        titulo: "Computador e celular",
        texto: "Veja as capturas das duas telas de cada variação, porque a maioria dos seus clientes vai comprar pelo celular.",
      },
      {
        titulo: "Para cada tipo de negócio",
        texto:
          "Há modelos para café da manhã, flores, festas, vinhos, vendas para empresas, loja de bairro, ofertas e muito mais.",
      },
    ],
    imagem: {
      src: "/modelos/galeria-champagne-d.webp",
      alt: "Captura de um modelo de loja de luxo em tons champagne no computador.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Abra a galeria de modelos", texto: "E filtre pelo que combina com a sua loja." },
      { titulo: "Teste a demonstração", texto: "Navegue como se fosse o cliente." },
      { titulo: "Crie a loja com o modelo escolhido", texto: "Os 7 dias grátis valem para testar." },
    ],
    faq: [
      {
        pergunta: "Todos os modelos estão em todos os planos?",
        resposta: "Alguns estão em todos os planos e outros apenas nos planos Pro e Premium. A galeria informa isso em cada modelo.",
      },
      {
        pergunta: "Posso mudar de modelo depois?",
        resposta: "Pode. Os produtos e os pedidos continuam como estão.",
      },
      {
        pergunta: "A demonstração cobra de verdade?",
        resposta: "Não. Nas lojas de demonstração, o checkout fica desligado e nada é cobrado.",
      },
    ],
    relacionados: ["loja-online-e-modelos", "app-no-celular", "cestas-para-empresas"],
  },
  {
    slug: "cestas-para-empresas",
    titulo: "Cestas para empresas",
    resumo: "Modelos e fluxo pensados para pedidos em quantidade, com orçamento.",
    icone: "Building2",
    status: "disponivel",
    seoTitulo: "Cestas para empresas: pedido em quantidade e orçamento",
    seoDescricao:
      "Venda presentes corporativos com modelos próprios para empresas: como funciona em passos, pedido de orçamento e carrinho em formato de orçamento.",
    heroTitulo: "Venda para empresas sem perder pedido grande",
    heroTexto:
      "Há modelos de loja pensados para quem vende para equipes e clientes: explicam como funciona e deixam o cliente pedir um orçamento em quantidade.",
    problema: {
      titulo: "Pedido grande não cabe em carrinho comum",
      texto:
        "Empresas pedem muitas unidades, querem prazo, nota e proposta. Um carrinho feito para uma cesta só não responde a nenhuma dessas perguntas.",
    },
    beneficios: [
      {
        titulo: "Pedido de orçamento",
        texto:
          "O formulário recolhe nome, empresa, quantidade e data. Se a loja tem WhatsApp cadastrado, abre a conversa com tudo preenchido.",
      },
      {
        titulo: "Passo a passo para o comprador",
        texto: "A página explica como escolher, definir quantidade e data e aprovar a proposta.",
      },
      {
        titulo: "Carrinho em formato de orçamento",
        texto: "No modelo para empresas, o carrinho se apresenta como orçamento e mostra o total.",
      },
    ],
    imagem: {
      src: "/modelos/empresas-corporativo-d.webp",
      alt: "Captura de um modelo de loja para empresas no computador, com proposta corporativa e cestas.",
      formato: "desktop",
    },
    passos: [
      { titulo: "O comprador escolhe as cestas", texto: "E a quantidade." },
      { titulo: "Pede o orçamento", texto: "Pelo formulário ou pelo carrinho." },
      { titulo: "Você responde com a proposta", texto: "Combinando prazo e condições com a empresa." },
    ],
    faq: [
      {
        pergunta: "As condições de preço por quantidade aparecem prontas?",
        resposta:
          "Aparecem como exemplo, claramente rotulado. As condições reais são as que você definir para a sua loja.",
      },
      {
        pergunta: "A plataforma emite nota fiscal?",
        resposta: "Não. A integração com sistema de notas ainda não existe; veja a página do Bling, em breve.",
      },
      {
        pergunta: "O orçamento é fechado dentro do site?",
        resposta: "O pedido de orçamento inicia a conversa. A aprovação e as condições são combinadas com a empresa por você.",
      },
    ],
    relacionados: ["galeria-de-modelos", "integracao-bling", "pagamentos-pix-cartao-boleto"],
  },
  {
    slug: "integracao-bling",
    titulo: "Integração com o ERP Bling",
    resumo: "Pedidos, estoque, produtos e nota fiscal conversando com o Bling.",
    icone: "Plug",
    status: "em-breve",
    seoTitulo: "Integração com o Bling para a sua loja: em breve",
    seoDescricao:
      "A integração com o ERP Bling, para pedidos, estoque, produtos e nota fiscal, ainda não está disponível. Veja o que já funciona hoje na plataforma.",
    heroTitulo: "Bling e a sua loja, no mesmo fluxo (em breve)",
    heroTexto:
      "Estamos preparando a ligação com o ERP Bling para pedidos, estoque, produtos e nota fiscal. Ela ainda não está disponível.",
    problema: {
      titulo: "Digitar o mesmo pedido duas vezes",
      texto:
        "Quem já usa um ERP precisa copiar pedidos da loja para ele e conferir estoque nos dois lugares. É trabalho dobrado e fonte de erro.",
    },
    beneficios: [
      { titulo: "Pedidos", texto: "A ideia é que os pedidos da loja cheguem ao Bling sem digitação." },
      { titulo: "Estoque e produtos", texto: "A ideia é manter produtos e saldo alinhados entre os dois." },
      { titulo: "Nota fiscal", texto: "A ideia é apoiar a emissão pelo Bling a partir do pedido." },
    ],
    imagem: {
      src: "/modelos/mercado-empresas-d.webp",
      alt: "Captura de uma loja de cestas para empresas no computador, com cestas em grade.",
      formato: "desktop",
    },
    passos: [
      { titulo: "Hoje", texto: "Você gerencia pedidos e estoque no painel da plataforma." },
      { titulo: "Em breve", texto: "Conectar a conta do Bling à loja." },
      { titulo: "Depois", texto: "Acompanhar pedidos, estoque e notas no mesmo fluxo." },
    ],
    faq: [
      {
        pergunta: "Já posso usar?",
        resposta: "Não. Esta integração ainda não está disponível, e não temos data confirmada para divulgar.",
      },
      {
        pergunta: "Posso vender enquanto isso?",
        resposta: "Sim. Pedidos, entregas, pagamentos e estoque já funcionam no painel da plataforma.",
      },
      {
        pergunta: "Como fico sabendo quando sair?",
        resposta: "Esta página será atualizada quando a integração estiver disponível.",
      },
    ],
    relacionados: ["estoque-e-compras", "painel-e-relatorios", "cestas-para-empresas"],
    aviso: "Este recurso ainda não existe. Esta página explica o que está planejado, não o que já funciona.",
  },
  {
    slug: "recuperacao-de-carrinho",
    titulo: "Recuperação de carrinho em horário fixo",
    resumo: "Lembrete a quem deixou o pedido sem pagar, em um horário que você escolhe. Em breve.",
    icone: "BellRing",
    status: "em-breve",
    seoTitulo: "Recuperação de carrinho em horário fixo: em breve",
    seoDescricao:
      "Hoje a loja já lembra por e-mail quem deixou o pedido sem pagar, uma vez por dia. O envio em horário fixo escolhido por você ainda está em preparação.",
    heroTitulo: "Lembrete no horário certo (em breve)",
    heroTexto:
      "Hoje a loja já envia um lembrete por e-mail a quem deixou o pedido aguardando pagamento. O que ainda não existe é escolher o horário fixo do envio.",
    problema: {
      titulo: "Pedido aguardando pagamento vira venda perdida",
      texto:
        "Muita gente começa a compra, se distrai e não paga. Um lembrete simples, na hora certa, recupera parte desses pedidos.",
    },
    beneficios: [
      {
        titulo: "O que já existe",
        texto:
          "Um e-mail de lembrete para pedidos aguardando pagamento, depois do tempo mínimo que você define. O envio roda uma vez por dia, em lote.",
      },
      {
        titulo: "O que está por vir",
        texto: "Escolher o horário fixo em que o lembrete sai. Ainda não está disponível.",
      },
      {
        titulo: "Link direto para pagar",
        texto: "O lembrete leva o cliente de volta à página do pedido, onde ele encontra o PIX para pagar.",
      },
    ],
    imagem: {
      src: "/modelos/mercado-datas-m.webp",
      alt: "Captura de uma loja de cestas de datas comemorativas no celular.",
      formato: "celular",
    },
    passos: [
      { titulo: "Cliente faz o pedido e não paga", texto: "O pedido fica aguardando pagamento." },
      { titulo: "O lembrete sai por e-mail", texto: "Hoje, no lote diário, depois do tempo que você definiu." },
      { titulo: "Cliente volta e paga", texto: "Pelo link do e-mail." },
    ],
    faq: [
      {
        pergunta: "Posso escolher o horário do envio hoje?",
        resposta: "Ainda não. Hoje o lembrete sai no lote diário da plataforma.",
      },
      {
        pergunta: "Isso lembra carrinho que nem virou pedido?",
        resposta: "Não. O lembrete atual é para pedidos já criados que estão aguardando pagamento.",
      },
      {
        pergunta: "Posso desligar?",
        resposta: "A automação é configurável no painel, na área de automações.",
      },
    ],
    relacionados: ["emails-automaticos", "pagamentos-pix-cartao-boleto", "painel-e-relatorios"],
    aviso: "O envio em horário fixo ainda não existe. O lembrete diário descrito aqui já funciona hoje.",
  },
];

export function getRecurso(slug: string): Recurso | undefined {
  return RECURSOS.find((r) => r.slug === slug);
}
