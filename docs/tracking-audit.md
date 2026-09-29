# Auditoria de rastreamento — Loja Juliana Cestas (30/09/2026)

Objetivo: saber o que o site mede hoje, o que NÃO mede, e o que colocar para o dono
decidir com número (não com achismo). Tudo abaixo foi conferido no site no ar e no banco,
em leitura (nada foi alterado).

## 1. O que existe hoje

| O quê | Situação | Como conferi |
|---|---|---|
| **Google Analytics 4** | **Desligado.** O código existe (`components/analytics/google-analytics.tsx`) mas só carrega se a variável `NEXT_PUBLIC_GA4_ID` estiver na Vercel. Não está: o HTML da home não tem nenhum script do Google. | `curl` da home: 0 ocorrências de `googletagmanager`/`gtag`. |
| **Meta Pixel / TikTok / Clarity / Hotjar** | Não existem. | Mesmo `curl`. |
| **Cliques em produto** (próprio) | **Funciona.** Cada clique num cartão de produto soma 1 na tabela `product_clicks` (1 por visita, ignora equipe e robôs). Alimenta a vitrine "Mais clicados". | Tabela com dados (5 cliques). |
| **Funil do pedido** (próprio) | Parcial. `order_events` guarda o histórico do pedido (criado, pago, preparo, entregue…). Serve para saber quanto tempo cada etapa demora. | Tabela `order_events`. |
| **Vendas por dia/cesta** | Existe no painel Início (faturamento, pedidos, ticket médio, mais vendidas). | Painel. |
| **E-mails** | Cada e-mail fica registrado em `notifications` (enviado/falhou). Não mede abertura nem clique. | Tabela `notifications`. |

## 2. O que NÃO é medido (lacunas por etapa do funil)

| Etapa | Pergunta que o dono não consegue responder hoje |
|---|---|
| Visita | Quantas pessoas visitam por dia? De onde vêm (Instagram, Google, WhatsApp, direto)? Celular ou computador? |
| Busca | O que as pessoas procuram na busca do topo? (dá ideia de cesta nova) |
| Produto | Qual cesta é mais vista? Quantos veem e não clicam em comprar? |
| Carrinho | Quantos adicionam ao carrinho e não finalizam? Qual cesta é mais abandonada? |
| Checkout | Em qual campo/etapa as pessoas desistem? Quantos chegam a "Ir para pagamento"? |
| Compra | Quanto de cada canal (Instagram etc.) virou venda? (sem GA4 não há origem) |
| Contato | Quantos clicam em "Falar no WhatsApp"? (hoje é o principal canal de pagamento e não é contado) |
| Pós-venda | Quantos clientes respondem a pesquisa? Quantos mandam foto da entrega? |

## 3. Plano de eventos (padrão GA4 e-commerce)

Um único ponto no código (`src/modules/analytics/events.ts`, função `track`) que **nunca quebra o
site** (se o Google estiver desligado ou bloqueado, não faz nada) e **nunca envia dado pessoal**
(sem nome, e-mail, telefone, endereço, CPF — só id da cesta, nome da cesta, preço, quantidade).

| Evento (nome GA4) | Quando dispara | Dados enviados |
|---|---|---|
| `view_item` | abre a página de uma cesta | id, nome, preço, categoria |
| `select_item` | clica num cartão da grade/vitrine | id, nome, lista (home/categoria/vitrine) |
| `search` | usa a busca do topo | termo pesquisado |
| `add_to_cart` | "Adicionar ao carrinho" | id, nome, preço, qtd |
| `view_cart` | abre o carrinho | itens, valor |
| `begin_checkout` | abre o checkout | itens, valor |
| `add_shipping_info` | escolhe data/horário de entrega | tipo (entrega/retirada) |
| `purchase` | pedido criado (uma vez por pedido) | nº do pedido, valor, itens |
| `generate_lead` | clica no WhatsApp (produto, checkout ou rodapé) | origem do clique |
| `share_delivery_photo` (novo) | cliente envia a foto da entrega | — |

Ficam de fora de propósito: qualquer dado do formulário do comprador.

## 4. O que depende do dono

1. **Criar a conta do Google Analytics 4** (analytics.google.com → Criar → Propriedade → "Web" →
   `https://julianacesta.com.br`) e copiar o **ID de medição** (começa com `G-`).
2. Colocar na Vercel (Settings → Environment Variables → Production): `NEXT_PUBLIC_GA4_ID` = esse `G-…`,
   e clicar em **Redeploy**.
3. Decidir sobre **aviso de cookies (LGPD)**: o GA4 grava cookies no navegador do cliente. O caminho mais
   seguro é um aviso simples "Usamos cookies para melhorar a loja — Aceitar / Recusar" e só ligar o
   Google depois do "Aceitar". Recomendo fazer junto (é pequeno) — precisa da sua decisão.

## 5. Riscos

- **Sem consentimento** o GA4 pode contrariar a LGPD → por isso o item 3 acima.
- **Bloqueadores de anúncio** escondem parte das visitas do GA4 (normal, 10–30%): os números do painel da
  loja (vendas, `product_clicks`) continuam sendo a verdade; o GA4 mostra tendência e origem.
- **Contar duas vezes** o `purchase` (recarregar a página de confirmação) → a regra é 1 por pedido
  (guardamos no navegador o nº já enviado).
