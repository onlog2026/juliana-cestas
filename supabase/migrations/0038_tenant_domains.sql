-- 0038_tenant_domains.sql — cadastro de domínio próprio por loja (módulo
-- `dominio`, catálogo desde a 0026).
--
-- ═══ O QUE ESTA MIGRAÇÃO É, E O QUE ELA NÃO É ═══
-- Esta tabela guarda o CADASTRO do domínio da lojista e o resultado da
-- checagem de DNS. Ela NÃO liga o domínio a nada de verdade: o roteamento
-- (`src/proxy.ts`, `src/lib/tenant/resolve-host.ts`) continua resolvendo só
-- por host de configuração (`LEGACY_HOST_TENANT_JSON`) e, quando existir
-- `PLATFORM_DOMAIN`, por subdomínio da plataforma. Um domínio pode estar aqui
-- com `status = 'verificado'` e ainda assim não servir tráfego nenhum -- a
-- ativação de verdade (certificado SSL + a Vercel aceitar o domínio) só
-- acontece quando alguém chamar a API da Vercel com um token de projeto, que
-- hoje não existe. Ver `src/modules/domains/service.ts` para a explicação
-- completa dos estados.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

create table if not exists tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- Sempre minúsculo -- a checagem de duplicidade (unique) e a consulta de
  -- DNS não podem depender de quem digitou com maiúscula. A normalização de
  -- verdade acontece no servidor (service.ts); esta constraint é o cinto e
  -- suspensório contra qualquer INSERT que não passe por lá.
  -- Único GLOBALMENTE (não por loja): duas lojas não podem reivindicar o
  -- mesmo endereço. A mensagem amigável ("esse domínio já está em uso por
  -- outra loja") é checada ANTES no servidor -- esta constraint UNIQUE é a
  -- garantia final contra corrida de duas gravações simultâneas.
  host text not null unique check (host = lower(host)),
  status text not null default 'pendente'
    check (status in ('pendente', 'verificando', 'verificado', 'erro')),
  -- O que a tela mostrou para a lojista configurar (tipo de registro, nome,
  -- valor esperado). Guardado em vez de recalculado a cada leitura porque o
  -- valor depende de `PLATFORM_DOMAIN` NO MOMENTO DO CADASTRO -- se a
  -- plataforma configurar o domínio dela depois, o registro já cadastrado não
  -- deve mudar de instrução por baixo dos pés da lojista sem ela saber.
  dns_instructions jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  last_checked_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists tenant_domains_tenant_id on tenant_domains (tenant_id);

alter table tenant_domains enable row level security;

-- Mesmo padrão de `brands`/`media_library` (migração 0033): só staff da
-- PRÓPRIA loja, via cliente autenticado. Toda leitura e escrita de verdade
-- acontece pelo painel, com service role (que ignora RLS) -- esta política é
-- a rede de segurança caso algum código futuro use o cliente do navegador.
do $$ begin
  create policy "tenant_domains_staff_all" on tenant_domains for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
