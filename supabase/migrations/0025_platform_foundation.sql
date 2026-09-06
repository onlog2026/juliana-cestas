-- 0025_platform_foundation.sql — as duas fundações do painel da plataforma.
--
-- Vem ANTES de qualquer tela do super admin, por decisão de arquitetura
-- (docs/SUPER-ADMIN-SPEC.md). São as duas coisas que, no Agentop, foram feitas
-- depois e custaram incidente:
--
--   1. `platform_admins` de VERDADE (lá a tela de equipe é fachada: cadastra
--      gente e não concede acesso nenhum; o acesso real é uma lista fixa de
--      e-mails duplicada em 3 lugares que já divergiram).
--   2. Trigger de guarda de cobrança: sem ele, o dono de qualquer loja manda
--      um PATCH e se dá o plano máximo, trial até 2099 e todos os módulos.
--
-- Idempotente.

-- ── 1. Quem é dono da plataforma ──────────────────────────────────────────
create table if not exists platform_admins (
  email text primary key,
  name text,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  modules text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into platform_admins (email, name, role) values
  ('adrianorosa2012@gmail.com', 'Adriano', 'owner'),
  ('adrianorosa1@hotmail.com',  'Adriano', 'owner')
on conflict (email) do update set is_active = true, role = 'owner';

alter table platform_admins enable row level security;
-- Ninguém lê nem escreve pelo cliente: só o servidor (service role).
-- Configuração de plataforma nasce fechada -- foi assim que, no Agentop,
-- `cms_settings` e `user_roles` acabaram com `USING(true)` e qualquer lojista
-- logado podia reescrever a configuração global.
do $$ begin
  create policy "platform_admins_service_only" on platform_admins for all using (false);
exception when duplicate_object then null; end $$;

-- Fonte ÚNICA de "é dono da plataforma" para o banco. O TypeScript
-- (src/lib/platform/super-admins.ts) tem que concordar com isto, e existe um
-- teste que compara os dois.
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from platform_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active
  )
$$;

-- ── 2. Registro de quem fez o quê ─────────────────────────────────────────
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  actor_email text,
  action text not null,
  target text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_tenant_created on audit_logs (tenant_id, created_at desc);
create index if not exists audit_logs_action_created on audit_logs (action, created_at desc);

alter table audit_logs enable row level security;
do $$ begin
  create policy "audit_logs_service_only" on audit_logs for all using (false);
exception when duplicate_object then null; end $$;

-- ── 3. Colunas de assinatura da loja ──────────────────────────────────────
alter table tenants add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));
alter table tenants add column if not exists owner_email text;
alter table tenants add column if not exists niche text;
alter table tenants add column if not exists settings jsonb not null default '{}'::jsonb;
alter table tenants add column if not exists updated_at timestamptz not null default now();

alter table tenants add column if not exists subscription_plan text;
alter table tenants add column if not exists subscription_status text not null default 'trialing'
  check (subscription_status in ('trialing','active','pending','overdue','canceled','inactive'));
alter table tenants add column if not exists trial_ends_at timestamptz;
alter table tenants add column if not exists paid_until timestamptz;
alter table tenants add column if not exists billing_cycle text;
alter table tenants add column if not exists asaas_customer_id text;
alter table tenants add column if not exists asaas_subscription_id text;

-- Cortesia do dono da plataforma
alter table tenants add column if not exists bonus_until timestamptz;
alter table tenants add column if not exists bonus_plan_slug text;
alter table tenants add column if not exists bonus_reason text;
alter table tenants add column if not exists bonus_granted_by text;
alter table tenants add column if not exists bonus_granted_at timestamptz;

-- Módulos liberados por voucher. As duas colunas são um PAR INDIVISÍVEL:
-- ler uma sem a outra já derrubou acesso pago no Agentop.
alter table tenants add column if not exists granted_modules text[] not null default '{}';
alter table tenants add column if not exists granted_modules_until timestamptz;

-- Contrato entre o checkout e o webhook: o preço é decidido no SERVIDOR e
-- guardado aqui; o webhook confere o valor recebido contra isto antes de ativar.
alter table tenants add column if not exists pending_plan_id text;
alter table tenants add column if not exists pending_expected_cents integer;
alter table tenants add column if not exists pending_cycle text;

-- A loja da Juliana é a fundadora: ativa, sem trial, nunca bloqueia.
update tenants
   set subscription_status = 'active',
       subscription_plan   = coalesce(subscription_plan, 'fundadora'),
       owner_email         = coalesce(owner_email, 'julianadasilvaleite98@gmail.com'),
       trial_ends_at       = null
 where id = 'a0000000-0000-4000-8000-000000000001';

-- ── 4. Trigger de guarda de cobrança ──────────────────────────────────────
-- Sem isto, `authenticated` com UPDATE em `tenants` significa: o dono da loja
-- se dá o plano máximo, trial até 2099 e todos os módulos, por um único PATCH
-- na API pública. RLS decide QUAIS LINHAS; o trigger decide QUAIS COLUNAS.
--
-- Escolha deliberada: colunas protegidas voltam ao valor antigo EM SILÊNCIO
-- (sem erro), para a tela do lojista nunca "quebrar" -- e cada tentativa vira
-- uma linha em audit_logs.
create or replace function public.tenants_billing_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_privileged boolean;
  actor text;
begin
  actor := coalesce(auth.jwt() ->> 'email', current_user);
  -- service_role (nosso backend), SQL direto e dono da plataforma passam.
  is_privileged := (auth.role() is null)
                or (auth.role() = 'service_role')
                or public.is_platform_admin();

  if is_privileged then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Loja criada pelo cliente nasce sempre em teste, sem plano nem módulo.
    new.subscription_status := 'trialing';
    new.subscription_plan   := null;
    new.paid_until          := null;
    new.bonus_until         := null;
    new.bonus_plan_slug     := null;
    new.granted_modules     := '{}';
    new.granted_modules_until := null;
    new.pending_plan_id     := null;
    new.pending_expected_cents := null;
    new.asaas_customer_id   := null;
    new.asaas_subscription_id := null;
    insert into audit_logs (tenant_id, actor_email, action, target, after)
    values (new.id, actor, 'tenant_insert_normalizado', new.slug, to_jsonb(new));
    return new;
  end if;

  -- UPDATE feito pelo cliente: colunas de dinheiro/entitlement não mudam.
  if new.subscription_plan is distinct from old.subscription_plan
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.paid_until is distinct from old.paid_until
     or new.bonus_until is distinct from old.bonus_until
     or new.bonus_plan_slug is distinct from old.bonus_plan_slug
     or new.granted_modules is distinct from old.granted_modules
     or new.granted_modules_until is distinct from old.granted_modules_until
     or new.status is distinct from old.status
     or new.owner_email is distinct from old.owner_email
  then
    insert into audit_logs (tenant_id, actor_email, action, target, before, after)
    values (old.id, actor, 'tenant_update_aparado', old.slug,
            to_jsonb(old), to_jsonb(new));
  end if;

  new.subscription_plan       := old.subscription_plan;
  new.trial_ends_at           := old.trial_ends_at;
  new.paid_until              := old.paid_until;
  new.bonus_until             := old.bonus_until;
  new.bonus_plan_slug         := old.bonus_plan_slug;
  new.bonus_reason            := old.bonus_reason;
  new.bonus_granted_by        := old.bonus_granted_by;
  new.bonus_granted_at        := old.bonus_granted_at;
  new.granted_modules         := old.granted_modules;
  new.granted_modules_until   := old.granted_modules_until;
  new.pending_plan_id         := old.pending_plan_id;
  new.pending_expected_cents  := old.pending_expected_cents;
  new.pending_cycle           := old.pending_cycle;
  new.asaas_customer_id       := old.asaas_customer_id;
  new.asaas_subscription_id   := old.asaas_subscription_id;
  new.status                  := old.status;
  new.owner_email             := old.owner_email;

  -- 'active' vindo do cliente vira 'pending': quem confirma pagamento é o
  -- webhook, segundos depois. Fecha o "trial imortal".
  if new.subscription_status = 'active' and old.subscription_status <> 'active' then
    new.subscription_status := 'pending';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tenants_billing_guard_trg on tenants;
create trigger tenants_billing_guard_trg
  before insert or update on tenants
  for each row execute function public.tenants_billing_guard();
