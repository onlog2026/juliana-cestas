-- 0023_seed_juliana_content.sql — grava em `site_content` o texto que HOJE
-- está escrito no código da loja da Juliana.
--
-- Por que existe: a partir da 0022 os componentes leem o texto do banco e, se
-- não acharem, caem num padrão NEUTRO (bom para loja nova, errado para ela).
-- Este seed garante que a loja da Juliana continue mostrando exatamente as
-- mesmas palavras depois da mudança -- copiadas literalmente do código, não
-- reescritas.
--
-- Idempotente: `on conflict do update` — pode rodar de novo sem duplicar.
-- Se a Juliana editar um texto pelo painel e alguém rodar isto outra vez, a
-- edição dela É SOBRESCRITA. Rodar UMA vez, agora, e não repetir.

insert into site_content (tenant_id, surface, section, slot, payload) values

('a0000000-0000-4000-8000-000000000001', 'store', 'benefits', 'default', '{
  "items": [
    {"title": "Feita à mão", "description": "Cada cesta é produzida artesanalmente, por encomenda.", "icon": "PenLine"},
    {"title": "Pagamento seguro", "description": "Pix ou cartão, via link de pagamento.", "icon": "ShieldCheck"},
    {"title": "Entrega agendada", "description": "Motorista dedicado, com hora combinada.", "icon": "Truck"},
    {"title": "Atendimento no WhatsApp", "description": "Fale direto com a Juliana Cestas.", "icon": "Headset"}
  ]
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'faq', 'default', '{
  "title": "Perguntas frequentes",
  "items": [
    {"question": "Como faço meu pedido?", "answer": "As reservas são feitas pelo WhatsApp (61) 99889-4889. Pedidos devem ser feitos com 24 horas de antecedência; pedidos personalizados exigem 3 dias."},
    {"question": "Como funciona o cartão personalizado?", "answer": "Cada cesta acompanha um cartão com laço elegante. Você escreve a mensagem e o nome de quem vai receber na hora do pedido."},
    {"question": "Quais as formas de pagamento?", "answer": "Pix ou cartão de crédito, com pagamento via link. O pedido é confirmado após o pagamento integral."},
    {"question": "Como funcionam as entregas?", "answer": "As entregas são feitas por motoristas terceirizados ou Uber, com taxa própria, de forma agendada. Pode haver variação de até 20 minutos por fatores fora do nosso controle (trânsito, clima). Se não houver quem receba, uma nova tentativa tem taxa de reentrega."},
    {"question": "Um item pode ser substituído?", "answer": "Todas as cestas são produzidas artesanalmente por encomenda. Se algum item estiver indisponível, ele é substituído por outro de valor equivalente, mantendo o padrão da cesta."}
  ]
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'signature', 'default', '{
  "eyebrow": "",
  "title": "Monte o cartãozinho da sua cesta",
  "body": "Toda cesta Juliana Cestas vai com um cartão de mensagem. Escreva para quem vai receber e veja o cartão ganhar forma, ali na tela.",
  "imageUrl": ""
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'whatsapp_cta', 'default', '{
  "title": "Prefere combinar por WhatsApp?",
  "body": "A gente monta a cesta ideal com você, direto na conversa.",
  "buttonLabel": "Chamar no WhatsApp"
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'collections', 'default', '{
  "title": "Presentes até R$ 200",
  "maxPriceCents": 20000,
  "highlightProductSlug": "cesta-memoravel"
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'category_tiles', 'default', '{
  "title": "As 5 cestas da Juliana Cestas"
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'about', 'default', '{
  "title": "Sobre a Juliana Cestas",
  "blocks": [
    {"text": "Detalhes que encantam, sabores que emocionam, amor que se celebra."},
    {"text": "A Juliana Cestas monta cestas de café da manhã e presentes afetivos em Brasília. Cada cesta é feita à mão, por encomenda, com cartão de mensagem personalizado — você escreve para quem vai receber, e a cesta chega com esse cuidado junto."}
  ]
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'returns', 'default', '{
  "title": "Trocas e entregas",
  "blocks": [
    {"text": "Como cada cesta é feita à mão, por encomenda, nossas regras de troca e entrega são estas:"},
    {"title": "Item indisponível", "text": "Todas as cestas são produzidas artesanalmente por encomenda. Se algum item estiver indisponível no dia, ele é substituído por outro de valor equivalente, mantendo o padrão da cesta."},
    {"title": "Entrega agendada", "text": "As entregas são feitas por motoristas terceirizados ou Uber, de forma agendada. Pode haver variação de até 20 minutos por fatores fora do nosso controle (trânsito, clima)."},
    {"title": "Reentrega", "text": "Se não houver quem receba a cesta no horário combinado, uma nova tentativa de entrega tem taxa de reentrega."},
    {"title": "Pagamento", "text": "Pix ou cartão de crédito, via link de pagamento. O pedido é confirmado após o pagamento integral."},
    {"text": "Situação diferente das acima? Fala com a gente pelo WhatsApp que a gente resolve."}
  ]
}'::jsonb),

('a0000000-0000-4000-8000-000000000001', 'store', 'business', 'default', '{
  "description": "Cestas de café da manhã artesanais em Brasília, com entrega no mesmo dia e cartão de mensagem personalizado.",
  "priceRange": "R$179 - R$489",
  "streetAddress": "QNL 7 Bloco D, Edifício São Raimundo",
  "addressLocality": "Brasília",
  "addressRegion": "DF",
  "areaServed": "Brasília",
  "opensAt": "08:00",
  "closesAt": "18:00",
  "openDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}'::jsonb)

on conflict (tenant_id, surface, section, slot)
do update set payload = excluded.payload, updated_at = now();

-- ── Perfil da loja ────────────────────────────────────────────────────────
-- A tabela `store_profile` está VAZIA para esta loja: o nome, o telefone e o
-- endereço estavam escritos no código (no JSON-LD). Agora que o JSON-LD lê do
-- banco, sem estas linhas a loja PERDERIA telefone e endereço nos resultados
-- do Google. São os mesmos dados que o site já publica hoje.
--
-- `coalesce` de propósito: se a Juliana já tiver preenchido algum campo pelo
-- painel, o valor dela vence -- este seed só preenche o que estiver vazio.
insert into store_profile (tenant_id, business_name, phone, street, city, state)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Juliana Cestas',
  '+5561998894889',
  'QNL 7 Bloco D, Edifício São Raimundo',
  'Brasília',
  'DF'
)
on conflict (tenant_id) do update set
  business_name = coalesce(nullif(store_profile.business_name, ''), excluded.business_name),
  phone         = coalesce(nullif(store_profile.phone, ''), excluded.phone),
  street        = coalesce(nullif(store_profile.street, ''), excluded.street),
  city          = coalesce(nullif(store_profile.city, ''), excluded.city),
  state         = coalesce(nullif(store_profile.state, ''), excluded.state);
