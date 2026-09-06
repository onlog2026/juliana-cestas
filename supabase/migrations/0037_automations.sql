-- 0037_automations.sql — módulo de automações (automation_rules + automation_runs).
-- Idempotente.
--
-- PRIMEIRA REGRA REAL: carrinho abandonado.
--
-- Este projeto NÃO tem carrinho persistido em banco -- o pedido nasce no
-- banco no momento em que o comprador confirma o checkout (ver
-- src/modules/checkout/create-order.ts), com status `aguardando_pagamento` e
-- payment_status `pending`. Ou seja: o próprio PEDIDO ainda não pago é o
-- "carrinho abandonado" deste modelo de negócio -- não existe uma etapa
-- anterior de "carrinho" que precise de tabela própria. Ver o comentário
-- completo em src/modules/automations/run.ts.
--
-- `automation_rules`: uma linha por loja+regra (liga/desliga e o prazo).
-- `automation_runs`: o que já foi disparado -- a unique constraint
-- (tenant_id, kind, reference_id) é a REDE DE SEGURANÇA que garante que o
-- mesmo pedido nunca recebe dois e-mails da mesma regra, mesmo que a rotina
-- rode duas vezes ou em paralelo. O código confere antes de gravar (por
-- eficiência, para não gastar um SELECT+INSERT com dado que já sabe que vai
-- ser recusado), mas quem garante de verdade é o índice único do banco.

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  kind text not null check (kind in ('carrinho_abandonado', 'pos_entrega')),
  enabled boolean not null default false,
  -- Mínimo 1h, máximo 48h. O código (clampDelayHours) já trava isso antes de
  -- gravar; o CHECK é o cinto e suspensório contra qualquer escrita direta.
  delay_hours integer not null default 2 check (delay_hours between 1 and 48),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind)
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  kind text not null check (kind in ('carrinho_abandonado', 'pos_entrega')),
  -- Pedido (ou, no futuro, outra entidade) que recebeu o disparo desta regra.
  reference_id uuid not null,
  sent_at timestamptz not null default now(),
  unique (tenant_id, kind, reference_id)
);
create index if not exists automation_runs_tenant_kind_idx
  on automation_runs (tenant_id, kind, sent_at desc);

alter table automation_rules enable row level security;
alter table automation_runs enable row level security;

-- Staff: tudo, mas só da própria loja -- igual ao padrão de cupons/reviews.
do $$ begin
  create policy "automation_rules_staff_all" on automation_rules for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "automation_runs_staff_select" on automation_runs for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- `notifications.type` tem CHECK fechado (0004 + 0017 + 0030). Sem liberar o
-- tipo novo aqui, o INSERT do e-mail de recuperação de carrinho seria
-- RECUSADO EM SILÊNCIO pelo banco e o e-mail sumiria sem ninguém perceber --
-- exatamente a armadilha já documentada em 0030 para `review_invite`.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    'order_confirmed', 'out_for_delivery', 'delivered',
    'ticket_created', 'ticket_reply',
    'review_invite', 'cart_recovery'
  ));
