-- 0029_reserved_slugs.sql — palavras que NÃO podem virar endereço de loja.
--
-- Nasce junto com o auto-atendimento (`/cadastro`): a partir do momento em que
-- qualquer pessoa escolhe o próprio endereço, o endereço deixa de ser um campo
-- de texto e passa a ser espaço de nomes COMPARTILHADO com as rotas do
-- sistema. Sem esta lista, alguém cadastra a loja `admin`, `api` ou `checkout`
-- e, no dia em que o endereço por subdomínio entrar no ar
-- (`<slug>.plataforma.com.br`), a loja passa a disputar caminho com a própria
-- plataforma. Corrigir depois significa TROCAR o endereço de uma loja que já
-- está divulgada — quebra link de cliente, QR code impresso e anúncio pago.
--
-- A checagem de verdade acontece no servidor
-- (`src/modules/platform/onboarding.ts`, função `createStoreForUser`), que lê
-- esta tabela com service role. A tabela existe para que a lista possa crescer
-- SEM deploy: rota nova amanhã = uma linha aqui.
--
-- RLS fechada de propósito (`using (false)`): esta lista não interessa ao
-- navegador. Quem responde "esse endereço pode?" é o servidor, com a resposta
-- já mastigada. Deixar a tabela legível de fora entregaria o mapa das rotas
-- internas para quem estiver sondando.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

create table if not exists reserved_slugs (
  slug text primary key,
  reason text,
  created_at timestamptz not null default now()
);

insert into reserved_slugs (slug, reason) values
  -- Rotas que já existem no sistema hoje.
  ('admin',            'painel do lojista'),
  ('api',              'rotas de servidor'),
  ('auth',             'retorno do login'),
  ('super',            'painel da plataforma'),
  ('plataforma',       'landing da plataforma'),
  ('planos',           'página pública de planos'),
  ('cadastro',         'criação de loja'),
  ('entrar',           'login da plataforma'),
  ('conta',            'área do cliente da loja'),
  ('checkout',         'finalização de compra'),
  ('pedido',           'acompanhamento de pedido'),
  ('produto',          'página de produto'),
  ('categoria',        'página de categoria'),
  ('atendimento',      'chamados'),
  ('faq',              'perguntas frequentes'),
  ('sobre',            'página institucional'),
  ('redefinir-senha',  'troca de senha'),
  ('sitemap',          'sitemap.xml'),
  ('robots',           'robots.txt'),
  -- Nomes que costumam virar subdomínio de infraestrutura.
  ('www',              'reservado de infraestrutura'),
  ('app',              'reservado de infraestrutura'),
  ('mail',             'reservado de infraestrutura'),
  ('email',            'reservado de infraestrutura'),
  ('smtp',             'reservado de infraestrutura'),
  ('ftp',              'reservado de infraestrutura'),
  ('cdn',              'reservado de infraestrutura'),
  ('static',           'reservado de infraestrutura'),
  ('assets',           'reservado de infraestrutura'),
  ('dev',              'reservado de infraestrutura'),
  ('staging',          'reservado de infraestrutura'),
  ('status',           'reservado de infraestrutura'),
  ('docs',             'reservado de infraestrutura'),
  ('blog',             'conteúdo da plataforma'),
  ('ajuda',            'conteúdo da plataforma'),
  ('suporte',          'conteúdo da plataforma'),
  ('contato',          'conteúdo da plataforma'),
  ('termos',           'conteúdo da plataforma'),
  ('privacidade',      'conteúdo da plataforma'),
  ('precos',           'conteúdo da plataforma'),
  -- Genéricos que ninguém deve tomar para si.
  ('loja',             'genérico'),
  ('lojas',            'genérico'),
  ('teste',            'genérico'),
  ('painel',           'genérico'),
  ('sistema',          'genérico'),
  ('null',             'genérico'),
  ('undefined',        'genérico'),
  -- A loja fundadora. Os DOIS: o slug que está no banco (`juliana-present`,
  -- migração 0006) e o slug de fallback do código
  -- (`LEGACY_TENANT_SLUG = 'juliana-cestas'`, src/lib/tenant/legacy.ts).
  -- Reservar só um dos dois deixaria o outro livre para um estranho.
  ('juliana-cestas',   'loja fundadora'),
  ('juliana-present',  'loja fundadora')
on conflict (slug) do nothing;

alter table reserved_slugs enable row level security;

do $$ begin
  create policy "reserved_slugs_service_only" on reserved_slugs for all using (false);
exception when duplicate_object then null; end $$;
