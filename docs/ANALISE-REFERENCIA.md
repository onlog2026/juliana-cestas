# Análise da referência (afetoepoesias.com.br) — 2026-09-02

Medido ao vivo no navegador (desktop 1280px e mobile 375px). Uso: entender estrutura, hierarquia, jornada e padrões de UX. **Nada daqui é copiado literalmente**: nem texto, nem imagem, nem marca, nem paleta, nem fonte.

## Plataforma
WordPress 7.1 + WooCommerce 11 + tema Flatsome 3.18 (child theme). Plugins visíveis: Contact Form 7, WP Bottom Menu.

## Achado decisivo
É um **catálogo com pedido pelo WhatsApp**. A página de produto não tem "adicionar ao carrinho", quantidade, variações, personalização, frete, parcelamento nem SKU; o botão do card é "Ler mais". O carrinho existe mas está vazio e sem uso; "minha conta" dá 404. Avaliações: zero. Há 9 links de WhatsApp por página.

Consequência para a Juliana Cestas: copiamos a **linguagem visual e a jornada** (calor, foto grande, categorias por ocasião, FAQ, menu inferior no celular) e construímos toda a venda real acima disso.

## Mapa dos 27 itens pedidos no prompt mestre
| # | Item | Na referência | Na Juliana Cestas |
|---|---|---|---|
| 1-3 | Header, menu, mega menu | Header 140px não fixo: logo, busca pill, ícone conta. Barra de categorias caramelo 34px, caixa alta. Sem mega menu | Header 72px fixo com busca; categorias em barra + drawer; sem mega menu (11 categorias cabem) |
| 4-5 | Banner/hero | Slider de imagem 400px (não renderizou sem JS), título em caixa alta creme sobre foto | Hero dividido: foto grande + promessa + 1 CTA |
| 6 | Categorias | Tiles com foto: Todos, Corporativo, Infantil, Maternidade, Masculinas e Bebidas, Formatura (+ Café da manhã/tarde, Box com vinhos, Zero & saudável, Presentes, Presentes até R$100) | 11 categorias por ocasião, administráveis |
| 7-8 | Produtos e cards | Card sem sombra/borda, foto 1:1 radius 15px, título 15.8px 700 centrado, preço 14.4px 400, botão ghost "Ler mais" 2px | Card com foto 4:5, nome, preço, parcelamento, avaliação, selo, "Adicionar" e compra rápida |
| 9-11 | Ofertas, mais vendidos, seções promocionais | "Mais pedidas" (5), "Cestas com vinho", "Presenteie com cestas" | Vitrines administráveis: mais vendidas, novidades, ofertas, até R$150, corporativo, românticas |
| 12-13 | Prova social, depoimentos | Seção "O que dizem nossos clientes" vazia; imprensa (PEGN) | Avaliações reais moderadas; seção oculta enquanto não houver |
| 14 | Benefícios | Só "entrega no mesmo dia" no hero | Bloco de benefícios: entrega em Brasília, pagamento seguro, cartão personalizado, atendimento |
| 15 | CTA | "Pedir no WhatsApp" repetido 9x | 1 CTA primário por seção; WhatsApp no menu inferior e no rodapé |
| 16 | Rodapé | Fundo caramelo #ceb393: logo, Ajuda (Meus pedidos, Atendimento), Institucional (Sobre, Privacidade), Atendimento (horários, e-mail) | Rodapé com institucional, políticas, atendimento, redes, selos de pagamento |
| 17 | WhatsApp | Botões e item do menu inferior | Botão no menu inferior + link em produto ("Comprar pelo WhatsApp") |
| 18 | Busca | Input pill "Pesquisar Cestas", sem autocomplete | Autocomplete com produtos, categorias, histórico |
| 19-20 | Login, cadastro | Ícone de conta; página inexistente | Supabase Auth, cadastro leve no checkout |
| 21 | Página de produto | Foto 1:1 + título 27px + preço 24px + "Conteúdo" (lista) + categorias + compartilhar + aba Avaliações + 8 relacionados | Galeria, preço/Pix/parcelas, personalização com cartão, data/turno, frete, relacionados, FAQ, avaliações |
| 22-23 | Carrinho, checkout | Vazios/sem uso | Carrinho persistente + checkout em etapas + Asaas |
| 24-26 | Institucional, FAQ, políticas | Sobre nós (fundo caramelo), FAQ 11 perguntas em acordeão, Política de privacidade | Páginas administráveis (CMS) + FAQ + políticas + LGPD |
| 27 | Pós-compra | "Meus pedidos" sem função | Timeline do pedido, notificações, avaliação pós-entrega |

## Tokens medidos (para entender, não para copiar)
```
Cores      primária #3e2719 · secundária #bb9372 · creme #f2e1cd · marfim #e7e7cf · faixas #ceb393
           fundo claro #f1f1f1 · texto #212121 · destaque #a16642 · whatsapp #2ecd67
Tipografia display "pf-marlet-display" 700 CAIXA ALTA 42-51px tracking 0.6-0.9px
           corpo Quicksand 400/700 16px / 25.6px · Inter secundária
Botões     radius 6px · 12-13px · 700 · caixa alta · tracking 0.36-0.38px · padding 0 15px
Busca      pill 99px · 33px alto · fundo rgba(0,0,0,.03) · borda rgba(0,0,0,.09)
Seções     hero 400px · "Sobre nós" fundo rgba(187,147,114,.56) padding 60px · newsletter/rodapé #ceb393
FAQ        acordeão com hairlines · título 17.6px Quicksand
Mobile     header 70px · menu inferior fixo 59px branco (WhatsApp, Home, Perfil elevado no centro, Produtos, Carrinho)
           cards 2 colunas de 158px · sem overflow horizontal
Categoria  sidebar "Categorias de produto" · 6 ordenações WooCommerce · 12 por página · grade 3 colunas · sem filtro de preço
```

## Oportunidades de conversão que a referência não aproveita (e nós vamos)
1. Comprar sem sair do site (carrinho + Pix na página).
2. Personalização visível (cartão, nome, data de entrega) antes de adicionar.
3. Prova social real com fotos de clientes.
4. Frete e prazo por CEP na página do produto.
5. Busca com autocomplete e filtros por preço e ocasião.
6. Recuperação de carrinho abandonado.
