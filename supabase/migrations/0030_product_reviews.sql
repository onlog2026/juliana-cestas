-- 0030_product_reviews.sql — avaliações de quem comprou (módulo `avaliacoes`).
--
-- FLUXO: pedido chega em `entregue` -> o sistema cria UMA linha aqui com o
-- HASH de um token aleatório e enfileira o e-mail de convite. O cliente abre
-- `/avaliar/<token>`, dá a nota e (se quiser) escreve/anexa foto -- isso
-- preenche `rating`/`comment`/`photo_url` e carimba `submitted_at`. A lojista
-- aprova ou recusa no painel. SÓ `status = 'aprovada'` aparece na loja.
--
-- POR QUE `rating` É NULO NO COMEÇO: a linha nasce no momento do CONVITE, e
-- nesse instante ainda não existe nota nenhuma. Quem separa "convite enviado,
-- ninguém respondeu" de "respondeu e está esperando a lojista" é
-- `submitted_at`:
--     submitted_at is null            -> convite pendente de resposta
--     submitted_at + status pendente  -> na fila de moderação da lojista
-- O CHECK garante que, quando `submitted_at` existe, a nota existe e está
-- entre 1 e 5 -- não dá para gravar avaliação enviada sem nota.
--
-- SEGURANÇA / RLS: a migração 0020 fechou oito políticas públicas que liberavam
-- SELECT para `anon` SEM filtro de loja -- na segunda loja da plataforma isso
-- vazaria tudo pela API REST. Aqui a política pública nasce já com o predicado
-- de loja (`tenant_id = public.current_tenant_id()`), então:
--   * `anon` (chave pública no navegador) NÃO tem perfil -> current_tenant_id()
--     devolve NULL -> nenhuma linha. Não existe caminho de vazamento.
--   * a vitrine do site não depende dessa política: ela lê no servidor com
--     service role (src/lib/supabase/admin.ts), que ignora RLS.
-- Escrita: nenhuma política de INSERT/UPDATE para anon/authenticated comum --
-- só service role (as server actions) e staff DA PRÓPRIA loja.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id) on delete cascade,
  -- nulo quando a avaliação é da compra inteira (cesta com vários itens), ou
  -- quando o produto foi apagado depois. Avaliação nunca some por causa disso.
  product_id uuid references products(id) on delete set null,
  customer_name text not null,
  customer_email text,
  rating smallint,
  comment text,
  photo_url text,
  status text not null default 'pendente' check (status in ('pendente','aprovada','recusada')),
  -- resposta pública da loja à avaliação
  reply text,
  replied_at timestamptz,
  -- só o HASH do token vai para o banco (mesmo padrão de orders.public_token_hash)
  invite_token_hash text,
  invited_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas adicionadas depois (se a tabela já existia numa versão anterior).
alter table product_reviews add column if not exists reply text;
alter table product_reviews add column if not exists replied_at timestamptz;
alter table product_reviews add column if not exists updated_at timestamptz not null default now();

-- UMA avaliação por pedido. É esta trava que torna o convite idempotente:
-- chamar createReviewInvite() duas vezes para o mesmo pedido bate aqui
-- (erro 23505) em vez de gerar um segundo token válido e um segundo e-mail.
create unique index if not exists product_reviews_tenant_order_uq
  on product_reviews (tenant_id, order_id);

-- Busca pelo token do convite (página /avaliar/<token>).
create unique index if not exists product_reviews_token_uq
  on product_reviews (invite_token_hash)
  where invite_token_hash is not null;

-- Listagem do painel e da vitrine: por loja + situação.
create index if not exists product_reviews_tenant_status_idx
  on product_reviews (tenant_id, status, submitted_at desc);

-- Vitrine do produto.
create index if not exists product_reviews_product_idx
  on product_reviews (tenant_id, product_id)
  where product_id is not null;

-- Nota só pode ser 1..5, e avaliação ENVIADA obrigatoriamente tem nota.
alter table product_reviews drop constraint if exists product_reviews_rating_check;
alter table product_reviews add constraint product_reviews_rating_check
  check (rating is null or (rating >= 1 and rating <= 5));

alter table product_reviews drop constraint if exists product_reviews_submitted_has_rating_check;
alter table product_reviews add constraint product_reviews_submitted_has_rating_check
  check (submitted_at is null or rating is not null);

alter table product_reviews enable row level security;

-- Leitura pública: SÓ aprovada, SÓ já respondida e SÓ da loja de quem pergunta.
do $$ begin
  create policy "product_reviews_public_select" on product_reviews for select to anon, authenticated
    using (
      status = 'aprovada'
      and submitted_at is not null
      and tenant_id = public.current_tenant_id()
    );
exception when duplicate_object then null; end $$;

-- Staff: tudo, mas só da própria loja.
do $$ begin
  create policy "product_reviews_staff_all" on product_reviews for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- `notifications.type` tem CHECK fechado (0004 + 0017). Sem liberar o tipo
-- novo aqui, o INSERT do convite seria RECUSADO EM SILÊNCIO pelo banco e o
-- e-mail sumiria sem ninguém perceber.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    'order_confirmed', 'out_for_delivery', 'delivered',
    'ticket_created', 'ticket_reply',
    'review_invite'
  ));
