# Design — Juliana Cestas

**Leitura do brief:** loja premium de presentes afetivos (cestas de café da manhã) para consumidor de Brasília, mobile-first, linguagem quente e artesanal, inspirada na referência mas com identidade própria.
**Dials:** variância 7 · movimento 5 · densidade 3 (loja) / 6 (painel).

## Tokens
```
--bg          #F6F1E8   linho quente (fundo da loja)
--surface     #FFFDF9   cards, painéis, inputs
--surface-2   #EFE7D9   faixas de seção, hover suave
--ink         #1F2A24   texto principal (verde-noite)
--ink-muted   #5F6B63   texto secundário, legendas
--primary     #1F4D3A   verde-cerrado: CTA, links, foco, preço
--primary-hover #17392B
--primary-soft  #DCE8DF chips selecionados, fundos de destaque leve
--accent      #D9A441   ipê-amarelo: selos, estrelas, preço promocional (uso raro)
--success     #2F7D5B   pagamento aprovado
--danger      #B23A3A   erro, remoção
--whatsapp    #25D366   só no botão WhatsApp
--border      rgba(31,42,36,.10)
--shadow      0 12px 32px rgba(31,42,36,.08)   (tingida, nunca preta)
--radius-card 16px · --radius-control 10px · chips/badges pill

Escuro (prefers-color-scheme): bg #15201A · surface #1C2A22 · surface-2 #24342B · ink #F1ECE2 · ink-muted #A9B3AC · primary #7FB79A · border rgba(241,236,226,.12)
```

## Tipografia (next/font)
- **Display:** Young Serif 400. h1 40px/1.1 · h2 32px/1.15 · h3 26px/1.2. Uso contido: títulos de seção, nome do produto, cartãozinho.
- **Corpo/UI:** Figtree 400/500/600/700. 16px/1.6 corpo · 14px UI · 13px legendas. Números com `font-variant-numeric: tabular-nums` em preço e tabela.
- Ênfase dentro de título: itálico/peso da MESMA família. Nunca misturar famílias na mesma frase.

## Formas e componentes
- Fotos e cards 16px; botões e inputs 10px; chips e badges pill. Regra única, sem exceções.
- Botão primário: verde-cerrado, texto marfim, 600, 48px alto no celular e 44px no desktop, sentence case, `:active` scale .98. Secundário: borda 1.5px verde, fundo transparente. WhatsApp: verde WhatsApp só nele.
- Card de produto: foto 4:5 com radius 16, nome (Figtree 600 16px), preço (Figtree 700 18px tabular), parcelamento (13px muted), avaliação (estrelas ipê + contagem), selo pill no canto da foto, botão "Adicionar" + ícone de compra rápida.
- Inputs: label acima, ajuda opcional, erro abaixo em `--danger`, foco com anel `--primary` 2px.

## Assinatura: o cartãozinho
Cartão de papel creme (#FBF6EA) com borda hairline, radius 12, sombra tingida, texto em Young Serif. Aparece: no produto (preview ao vivo enquanto digita), no carrinho, na revisão do checkout, na confirmação e no e-mail. Animação: entra com fade + 8px de subida (Motion, `useReducedMotion` respeitado).

## Estrutura da home
1. Header 72px fixo: logo, busca, conta, carrinho com contador. Barra de categorias abaixo (scroll horizontal no celular).
2. Hero dividido: foto grande à esquerda; à direita título (Young Serif, máx. 2 linhas), 1 frase (≤ 20 palavras), 1 CTA primário. Sem eyebrow.
3. Categorias por ocasião: tiles com foto, 2 colunas no celular, 4-6 no desktop.
4. Mais pedidas: carrossel de cards com "Adicionar".
5. "Monte com o cartãozinho": bloco assinatura com preview interativo.
6. Coleções: até R$150 e corporativo, layout assimétrico (1 grande + 2 pequenos).
7. Prova social: avaliações reais com foto (oculta enquanto não houver).
8. Benefícios: 4 itens em linha com ícone lucide.
9. FAQ: acordeão.
10. CTA WhatsApp + rodapé.
Regras: máximo 1 eyebrow a cada 3 seções; nenhuma família de layout repetida; zero travessões; sem três cards iguais em linha; sem "scroll" cue; sem marquee duplo.

## Mobile
Menu inferior fixo 64px (Início, Buscar, Carrinho com contador, Conta, WhatsApp) com `env(safe-area-inset-bottom)`; filtros em drawer; na página de produto, barra fixa inferior com preço + "Adicionar"; toque ≥ 44px; nunca `h-screen`, sempre `min-h-[100dvh]`; testar 320/375/390/414/768/1024/1280/1440.

## Painel admin
shadcn/ui customizado com os tokens acima (radius 10px), sidebar fixa, tabelas com filtros, busca, ações em lote, drawers para edição, confirmação em ações destrutivas, skeletons, toasts, estados vazios com ação, breadcrumbs, atalhos. Densidade 6.

## Proibido (AI tells)
Travessão em qualquer texto visível; Inter como padrão; gradiente roxo; três cards iguais; eyebrow em toda seção; números falsos de precisão; nomes genéricos em dados demo; ícones desenhados à mão; screenshots falsos feitos de div; sombra preta; `#000`/`#fff` puros; `window.addEventListener('scroll')`; `filter: blur()` em `position: fixed`.
