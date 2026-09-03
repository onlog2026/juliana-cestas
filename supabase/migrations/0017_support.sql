-- 0017_support.sql
-- SAC / atendimento: chamados do comprador (área logada) e do painel admin.
-- Sem canais sociais (Instagram/Facebook) -- decisão do dono, fica pra depois.
-- Idempotente.

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid references customers(id),
  buyer_email text not null,
  buyer_name text not null,
  subject text not null,
  category text not null check (category in ('pedido', 'entrega', 'pagamento', 'bug', 'feedback')),
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'resolvido', 'reaberto')),
  order_id uuid references orders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
alter table support_tickets enable row level security;
create index if not exists support_tickets_tenant_idx on support_tickets (tenant_id, status, last_message_at desc);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender text not null check (sender in ('customer', 'staff')),
  sender_name text,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);
alter table support_messages enable row level security;
create index if not exists support_messages_ticket_idx on support_messages (ticket_id, created_at);

-- Mesmo padrão de orders/customers: nenhuma policy pra anon/authenticated
-- comum -- o comprador acessa via Server Action com service role + checagem
-- de posse em app code (igual customers/service.ts). Só staff lê direto.
do $$ begin
  create policy "support_tickets_staff_all" on support_tickets for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "support_messages_staff_all" on support_messages for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- notifications precisa aceitar e-mail de chamado (sem order_id, com
-- ticket_id) além do e-mail de pedido que já existia.
alter table notifications alter column order_id drop not null;
alter table notifications add column if not exists ticket_id uuid references support_tickets(id) on delete cascade;
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('order_confirmed', 'out_for_delivery', 'delivered', 'ticket_created', 'ticket_reply'));
