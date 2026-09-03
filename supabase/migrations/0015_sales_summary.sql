-- 0015_sales_summary.sql
-- RPCs de agregação pro painel de vendas do admin -- soma no banco em vez
-- de trazer todos os pedidos pro Node e somar lá (evita N+1 e escala melhor
-- conforme o número de pedidos cresce). Idempotente.

-- Status que contam como "vendido de verdade" pro faturamento: a partir de
-- pago (aguardando_pagamento/novo ainda não é dinheiro confirmado; cancelado
-- e reembolsado não são venda).
create or replace function public.sales_summary(p_tenant uuid, p_from date, p_to date)
returns table (revenue_cents bigint, orders_count bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(total_cents), 0)::bigint, count(*)::bigint
  from orders
  where tenant_id = p_tenant
    and status in ('pago', 'em_preparacao', 'pronto', 'saiu_para_entrega', 'entregue')
    and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
$$;
revoke all on function public.sales_summary(uuid, date, date) from public, anon, authenticated;
grant execute on function public.sales_summary(uuid, date, date) to service_role;

create or replace function public.sales_by_day(p_tenant uuid, p_from date, p_to date)
returns table (day date, revenue_cents bigint, orders_count bigint)
language sql stable security definer set search_path = public as $$
  select (created_at at time zone 'America/Sao_Paulo')::date as day,
    coalesce(sum(total_cents), 0)::bigint, count(*)::bigint
  from orders
  where tenant_id = p_tenant
    and status in ('pago', 'em_preparacao', 'pronto', 'saiu_para_entrega', 'entregue')
    and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
  group by 1
  order by 1
$$;
revoke all on function public.sales_by_day(uuid, date, date) from public, anon, authenticated;
grant execute on function public.sales_by_day(uuid, date, date) to service_role;

create or replace function public.sales_top_products(p_tenant uuid, p_from date, p_to date, p_limit integer default 5)
returns table (name text, qty bigint, revenue_cents bigint)
language sql stable security definer set search_path = public as $$
  select oi.name, sum(oi.qty)::bigint, sum(oi.unit_price_cents * oi.qty)::bigint
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.tenant_id = p_tenant
    and oi.kind = 'product'
    and o.status in ('pago', 'em_preparacao', 'pronto', 'saiu_para_entrega', 'entregue')
    and (o.created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
  group by oi.name
  order by 3 desc
  limit p_limit
$$;
revoke all on function public.sales_top_products(uuid, date, date, integer) from public, anon, authenticated;
grant execute on function public.sales_top_products(uuid, date, date, integer) to service_role;
