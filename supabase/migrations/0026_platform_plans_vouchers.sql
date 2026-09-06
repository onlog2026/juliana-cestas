-- 0026_platform_plans_vouchers.sql — planos, módulos, cortesias, config,
-- erros e uso. É o que as telas do painel da plataforma precisam para deixar
-- de ser leitura e passar a controlar o negócio.
--
-- Decisões tomadas a partir dos erros documentados no Agentop
-- (docs/SUPER-ADMIN-SPEC.md):
--   * DINHEIRO SEMPRE EM CENTAVOS, em toda tabela, com o nome dizendo isso.
--     Lá, plano estava em centavos e add-on em reais na MESMA tela.
--   * `limit_display` (texto que o cliente lê) é SEPARADO de `limit_value`
--     (número que o servidor obedece). Lá era um campo só, texto livre, que
--     parecia trava e não era.
--   * Módulo vendável sai de uma LISTA FECHADA que o código conhece
--     (`platform_modules`). Lá dava para criar e cobrar por um add-on que
--     nenhuma linha de código sabia liberar.
--   * Toda tabela de configuração da plataforma nasce com RLS fechada.
-- Idempotente.

-- ── Módulos que o sistema sabe entregar ───────────────────────────────────
create table if not exists platform_modules (
  slug text primary key,
  name text not null,
  description text,
  category text not null default 'loja',
  is_core boolean not null default false,   -- núcleo: sempre liberado
  sort_order integer not null default 0
);

insert into platform_modules (slug, name, description, category, is_core, sort_order) values
  ('dashboard',    'Painel de vendas',      'Faturamento, pedidos e produtos mais vendidos.', 'nucleo', true, 1),
  ('pedidos',      'Pedidos',               'Receber, acompanhar e mudar o status dos pedidos.', 'nucleo', true, 2),
  ('produtos',     'Produtos',              'Cadastro de produtos, fotos, estoque e preços.', 'nucleo', true, 3),
  ('configuracoes','Configurações da loja', 'Dados do negócio, endereço e contato.', 'nucleo', true, 4),
  ('pagamentos',   'Pagamentos',            'Conectar a conta de recebimento da loja.', 'nucleo', true, 5),
  ('entregas',     'Entregas',              'Agenda de entregas por dia e horário.', 'operacao', false, 10),
  ('atendimento',  'Atendimento',           'Chamados dos clientes da loja.', 'operacao', false, 11),
  ('cupons',       'Cupons de desconto',    'Criar cupons por valor, percentual ou frete grátis.', 'vendas', false, 12),
  ('cms',          'Banners e textos',      'Editar banners, categorias e textos do site.', 'vitrine', false, 13),
  ('seo',          'SEO',                   'Título, descrição e palavras-chave para o Google.', 'vitrine', false, 14),
  ('templates',    'Modelos de loja',       'Escolher e trocar o modelo visual da loja.', 'vitrine', false, 15),
  ('paginas',      'Páginas',               'Montar e reordenar as seções das páginas.', 'vitrine', false, 16),
  ('galeria',      'Galeria e vídeos',      'Biblioteca de fotos e vídeos da loja.', 'vitrine', false, 17),
  ('marcas',       'Marcas',                'Cadastro de marcas dos produtos.', 'vitrine', false, 18),
  ('ia',           'Assistente de IA',      'Escreve descrição e SEO do produto.', 'crescimento', false, 19),
  ('social',       'Redes sociais',         'Conectar Instagram e mostrar o feed na loja.', 'crescimento', false, 20),
  ('dominio',      'Domínio próprio',       'Usar o próprio endereço (www.sualoja.com.br).', 'crescimento', false, 21),
  ('equipe',       'Equipe',                'Convidar pessoas e escolher o que cada uma acessa.', 'operacao', false, 22),
  ('financeiro',   'Financeiro',            'Recebíveis, saldo e extrato da loja.', 'operacao', false, 23),
  ('automacoes',   'Automações',            'E-mails automáticos e recuperação de carrinho.', 'crescimento', false, 24),
  ('avaliacoes',   'Avaliações',            'Pedir e publicar avaliação de quem comprou.', 'crescimento', false, 25)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category = excluded.category, is_core = excluded.is_core, sort_order = excluded.sort_order;

alter table platform_modules enable row level security;
do $$ begin
  create policy "platform_modules_read" on platform_modules for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

-- ── Planos ────────────────────────────────────────────────────────────────
create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  badge text,
  description text,
  monthly_cents integer not null default 0 check (monthly_cents >= 0),
  annual_discount_pct numeric(5,2) not null default 0 check (annual_discount_pct between 0 and 100),
  max_products integer,          -- null = ilimitado
  max_team_members integer,
  is_visible boolean not null default true,
  is_anchor boolean not null default false,   -- "mais popular"
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plano da fundadora: oculto na vitrine, tudo liberado, nunca bloqueia.
insert into subscription_plans (slug, name, description, monthly_cents, is_visible, sort_order)
values ('fundadora', 'Fundadora', 'Plano da primeira loja da plataforma. Não aparece na vitrine.', 0, false, 99)
on conflict (slug) do nothing;

create table if not exists plan_modules (
  plan_id uuid not null references subscription_plans(id) on delete cascade,
  module_slug text not null references platform_modules(slug) on delete cascade,
  status text not null default 'excluded' check (status in ('included','addon','excluded')),
  -- SEPARADOS de propósito: um é texto de vitrine, o outro é a trava real.
  limit_display text,            -- "até 500 produtos"
  limit_value integer,           -- 500  (null = sem limite)
  primary key (plan_id, module_slug)
);

-- A fundadora tem tudo incluído.
insert into plan_modules (plan_id, module_slug, status)
select p.id, m.slug, 'included' from subscription_plans p, platform_modules m
where p.slug = 'fundadora'
on conflict (plan_id, module_slug) do update set status = 'included';

alter table subscription_plans enable row level security;
alter table plan_modules enable row level security;
-- Leitura pública: a página de planos precisa mostrar preço sem login.
do $$ begin
  create policy "subscription_plans_read" on subscription_plans for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "plan_modules_read" on plan_modules for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

-- ── Cortesias (vouchers) ──────────────────────────────────────────────────
create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  tenant_id uuid references tenants(id) on delete cascade,  -- nominal; null = qualquer loja
  grant_plan_slug text,
  grant_modules text[] not null default '{}',
  access_days integer not null default 30 check (access_days between 1 and 365),
  valid_until timestamptz,          -- prazo para RESGATAR (≠ duração do acesso)
  max_uses integer not null default 1 check (max_uses >= 1),
  used_count integer not null default 0,
  redeemed_by text,
  redeemed_at timestamptz,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists vouchers_tenant on vouchers (tenant_id);

alter table vouchers enable row level security;
-- O cliente NUNCA lê nem escreve: manda só o código, o servidor decide.
do $$ begin
  create policy "vouchers_service_only" on vouchers for all using (false);
exception when duplicate_object then null; end $$;

-- ── Configuração da plataforma ────────────────────────────────────────────
create table if not exists saas_config (
  id integer primary key default 1 check (id = 1),
  platform_name text not null default 'Plataforma',
  support_email text,
  trial_days integer not null default 2 check (trial_days between 0 and 90),
  -- null = no teste a loja vê TUDO. Lista = só estes módulos.
  trial_module_slugs text[],
  storefront_grace_days integer not null default 7,
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into saas_config (id) values (1) on conflict (id) do nothing;

alter table saas_config enable row level security;
do $$ begin
  create policy "saas_config_service_only" on saas_config for all using (false);
exception when duplicate_object then null; end $$;

-- ── Erros e alertas ───────────────────────────────────────────────────────
create table if not exists app_errors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  module text not null,
  action text not null,
  level text not null default 'warning' check (level in ('warning','error','critical')),
  message text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists app_errors_created on app_errors (created_at desc);
create index if not exists app_errors_level_created on app_errors (level, created_at desc);

alter table app_errors enable row level security;
do $$ begin
  create policy "app_errors_service_only" on app_errors for all using (false);
exception when duplicate_object then null; end $$;
