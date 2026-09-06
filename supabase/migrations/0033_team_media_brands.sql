-- 0033_team_media_brands.sql — as três tabelas que faltavam para os módulos
-- `equipe`, `galeria` e `marcas` (slugs que já existem em `platform_modules`
-- desde a 0026, mas que nunca tiveram tela nem tabela).
--
-- REGRA QUE ESTA MIGRAÇÃO NÃO PODE QUEBRAR (aprendida na 0020):
-- nenhuma política de leitura pública sem predicado de loja. Na 0020 oito
-- políticas liberavam SELECT para `anon` sem nenhum filtro de `tenant_id`;
-- com a segunda loja no ar, qualquer pessoa com a chave pública leria produtos,
-- preços e custos de TODAS as lojas pela API REST. Aqui as três tabelas novas
-- nascem fechadas: quem lê é o servidor (service role, que ignora RLS) e, pelo
-- cliente autenticado, só staff da PRÓPRIA loja.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

-- ── 1. Equipe: o que cada pessoa da loja pode abrir ───────────────────────
-- `allowed_modules` VAZIO NÃO É "pode tudo": é "só o núcleo". A regra fica no
-- TypeScript (src/modules/team/service.ts, função `pessoaPodeVerModulo`), mas a
-- coluna nasce com default '{}' justamente para que uma pessoa criada por
-- engano nasça sem nada além do básico, e não com o painel inteiro.
alter table profiles add column if not exists allowed_modules text[] not null default '{}'::text[];

-- `active = false` é o "excluir" desta plataforma. Apagar a linha de `profiles`
-- apagaria junto o histórico de quem fez o quê (audit_logs, updated_by,
-- pedidos atendidos). Desativar preserva tudo.
alter table profiles add column if not exists active boolean not null default true;

create index if not exists profiles_tenant_active on profiles (tenant_id, active);

-- Convites enviados. O convite de verdade é o do Supabase
-- (`auth.admin.inviteUserByEmail`) -- quem define a senha é a própria pessoa,
-- pelo link que chega no e-mail dela. Esta tabela é o REGISTRO do convite:
-- quem convidou, quando, com quais módulos, e se já foi aceito.
create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null,
  allowed_modules text[] not null default '{}'::text[],
  invited_by uuid references auth.users(id) on delete set null,
  -- Hash de um token gerado no servidor. Guardado como HASH (nunca o token em
  -- claro) para o dia em que existir uma tela própria de aceite; hoje o aceite
  -- acontece pelo link do Supabase.
  token_hash text,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists team_invites_tenant_created on team_invites (tenant_id, created_at desc);
create unique index if not exists team_invites_tenant_email_pendente
  on team_invites (tenant_id, lower(email)) where accepted_at is null;

alter table team_invites enable row level security;

-- Fechada para TODO cliente, inclusive staff: a linha guarda hash de token.
-- Quem lê e escreve é o painel, pelo servidor (service role). Mesmo padrão de
-- `platform_admins` na 0025.
do $$ begin
  create policy "team_invites_service_only" on team_invites for all using (false);
exception when duplicate_object then null; end $$;

-- ── 2. Galeria: biblioteca de fotos e vídeos da loja ──────────────────────
create table if not exists media_library (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind text not null check (kind in ('imagem', 'video')),
  url text not null,
  thumb_url text,
  title text,
  alt text,
  size_bytes bigint,
  width integer,
  height integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_library_tenant_created on media_library (tenant_id, created_at desc);
create unique index if not exists media_library_tenant_url on media_library (tenant_id, url);

alter table media_library enable row level security;

-- Só staff da própria loja. Sem política para `anon`: a vitrine não lê esta
-- tabela -- ela lê a URL já gravada em produto/banner/marca.
do $$ begin
  create policy "media_library_staff_all" on media_library for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- ── 3. Marcas ─────────────────────────────────────────────────────────────
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists brands_tenant_sort on brands (tenant_id, sort_order);

alter table brands enable row level security;

-- Staff da própria loja: tudo.
do $$ begin
  create policy "brands_staff_all" on brands for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Leitura da vitrine COM predicado de loja. Não existe política para `anon` de
-- propósito: `anon` não carrega loja nenhuma no token, então qualquer política
-- para ele seria "todas as lojas" -- exatamente o furo que a 0020 fechou. Todo
-- o storefront lê marcas no servidor, com service role (que ignora RLS), igual
-- a produtos, categorias e banners desde a 0020.
do $$ begin
  create policy "brands_tenant_read" on brands for select to authenticated
    using (active = true and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Produto pertence a no máximo uma marca. `on delete set null`: excluir a marca
-- NUNCA apaga o produto -- só desliga a referência. Diferente de
-- `products.category_id`, que é RESTRICT de propósito (a categoria organiza a
-- navegação do site; a marca é um dado descritivo do produto).
alter table products add column if not exists brand_id uuid references brands(id) on delete set null;
create index if not exists products_brand on products (brand_id);
