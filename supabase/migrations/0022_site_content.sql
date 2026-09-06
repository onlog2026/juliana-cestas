-- 0022_site_content.sql — textos e blocos editáveis da loja, por loja.
--
-- PROBLEMA: benefícios, FAQ, "cartãozinho", chamada do WhatsApp, páginas
-- /sobre /faq /trocas-e-devolucoes e os dados do negócio (JSON-LD) estão
-- escritos direto no código, com a marca "Juliana Cestas" fixa. A segunda
-- loja mostraria o texto da primeira.
--
-- SOLUÇÃO: uma tabela genérica (surface, section, slot, payload jsonb).
-- Quem lê usa `getContent(tenantId, surface, section)`; se não houver linha,
-- cai num padrão NEUTRO definido no código (src/modules/content/defaults.ts) --
-- assim uma loja nova nasce com texto genérico e sensato, e a loja da Juliana
-- recebe o texto atual dela via seed, sem mudar nada na tela.
--
-- `tenant_id null` fica reservado para a landing da PLATAFORMA (F6).
-- Idempotente.

create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  surface text not null,          -- 'store' | 'platform'
  section text not null,          -- 'benefits' | 'faq' | 'about' | ...
  slot text not null default 'default',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- ATENÇÃO: os índices ÚNICOS PARCIAIS que existiam aqui foram substituídos
-- pela constraint da migration 0024. Índice parcial não serve para `ON
-- CONFLICT` sem repetir a condição, e o PostgREST (usado pelo painel) não
-- consegue expressá-la -- quebrava o seed e o botão "Salvar" da tela de textos.
-- A unicidade agora vem de `site_content_key` (0024).

create index if not exists site_content_tenant_surface
  on site_content (tenant_id, surface);

alter table site_content enable row level security;

-- Leitura pública: NÃO. A vitrine lê no servidor com service role, igual ao
-- resto do catálogo depois da 0020 -- nada de policy `anon` sem filtro de loja.
do $$ begin
  create policy "site_content_staff_all" on site_content for all to authenticated
    using (tenant_id is not null and public.is_staff() and tenant_id = public.current_tenant_id())
    with check (tenant_id is not null and public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
