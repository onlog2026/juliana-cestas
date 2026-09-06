-- 0032_storefront_composition.sql — a composição da vitrine, por loja.
--
-- PROBLEMA: a home é montada em código (`src/app/(store)/page.tsx`), com as
-- seções nesta ordem e não em outra. Enquanto existe uma loja só, isso está
-- certo. Com várias lojas, cada uma quer um site com CARA diferente -- e a
-- decisão do dono é explícita: modelo não é troca de cor, é troca de páginas e
-- de seções.
--
-- SOLUÇÃO: duas tabelas.
--   store_theme  -> qual modelo a loja usa e como ela está pintada.
--   store_pages  -> quais seções cada caminho tem, e em que ordem.
-- Mais store_pages_history, que guarda a foto do "antes" de cada troca para
-- que desfazer seja possível.
--
-- ATENÇÃO -- O QUE ESTA MIGRAÇÃO **NÃO** FAZ:
--   nada aqui muda a loja da Juliana. As tabelas nascem vazias, e mesmo depois
--   de preenchidas a página só aparece quando `published = true` E quando
--   alguém ligar o renderizador (veja o cabeçalho de src/storefront/renderer.tsx).
--   Nenhuma tabela existente é alterada. Nenhum dado existente é tocado.
--
-- RLS: toda política tem predicado de loja. Este projeto já teve exatamente
-- esse furo -- oito políticas liberavam SELECT para `anon` SEM filtro de loja
-- (corrigido na 0020_rls_tenant_isolation.sql). Aqui, como no site_content
-- (0022), NÃO existe política pública: a vitrine lê no servidor com service
-- role, que ignora RLS.
--
-- Idempotente: pode rodar duas vezes sem erro.

-- ── tema / modelo da loja ────────────────────────────────────────────────
create table if not exists store_theme (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  -- 'classica' | 'editorial' | 'catalogo' (src/storefront/templates/index.ts)
  template_key text not null default 'classica',
  -- os valores das variáveis do globals.css: {"primary":"#556b2f", ...}
  tokens jsonb not null default '{}'::jsonb,
  -- {"sans":"figtree","display":"young-serif"} -- só fontes já carregadas por next/font
  fonts jsonb not null default '{}'::jsonb,
  -- {"header":{...},"footer":{...},"productPage":{...}}
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists store_theme_template on store_theme (template_key);

-- ── páginas montadas ─────────────────────────────────────────────────────
create table if not exists store_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- caminho público: '/', '/sobre', '/faq'...
  path text not null,
  title text not null default '',
  -- [{"id":"hero","type":"hero","variant":"carousel","props":{...}}, ...]
  sections jsonb not null default '[]'::jsonb,
  -- Nasce FALSO de propósito: materializar um modelo não publica nada.
  published boolean not null default false,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- Constraint (não índice parcial): o painel grava via PostgREST com upsert, e
-- `ON CONFLICT` precisa de uma constraint nomeada. Índice parcial já quebrou o
-- botão Salvar do CMS neste projeto -- ver o comentário da 0022/0024.
do $$ begin
  alter table store_pages add constraint store_pages_tenant_path unique (tenant_id, path);
exception when duplicate_table then null; when duplicate_object then null; end $$;

create index if not exists store_pages_tenant_published on store_pages (tenant_id, published);

-- ── histórico (para desfazer a troca de modelo) ──────────────────────────
create table if not exists store_pages_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- o modelo que estava valendo ANTES da troca
  template_key text,
  -- foto completa do antes: {"theme":{...},"pages":[{...}]}
  snapshot jsonb not null,
  -- 'troca-de-modelo' | 'desfazer'
  reason text not null default 'troca-de-modelo',
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists store_pages_history_tenant_data
  on store_pages_history (tenant_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table store_theme enable row level security;
alter table store_pages enable row level security;
alter table store_pages_history enable row level security;

-- Uma política por tabela, sempre com o predicado da loja nos dois lados
-- (using E with check). Sem `using (true)`, sem política para `anon`.
do $$ begin
  create policy "store_theme_staff_all" on store_theme for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "store_pages_staff_all" on store_pages for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Histórico: a loja LÊ o próprio histórico (é o que alimenta o "desfazer"),
-- mas quem escreve é sempre o servidor com service role. Sem política de
-- insert/update para o cliente autenticado -- histórico que o usuário pode
-- reescrever não é histórico.
do $$ begin
  create policy "store_pages_history_staff_select" on store_pages_history for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
