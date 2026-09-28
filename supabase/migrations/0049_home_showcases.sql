-- 0049_home_showcases.sql — vitrines "Mais comprados" e "Mais clicados" da home.
--
-- Duas peças, ambas SOMENTE-SERVIDOR (o navegador nunca fala com elas direto):
--
--  1) top_products_sold: soma as unidades vendidas por produto. Só conta pedido
--     JÁ PAGO em diante (pago, em_preparacao, pronto, saiu_para_entrega,
--     entregue) -- pedido cancelado/reembolsado/aguardando pagamento não entra.
--
--  2) product_clicks + increment_product_click + top_products_clicked: contagem
--     de cliques por produto e por dia. O tenant é derivado do PRODUTO dentro do
--     SQL (nunca vem do navegador) e produto inativo/inexistente não conta.
--
-- A loja funciona sem isto: sem a migração, as vitrines simplesmente não
-- aparecem (o código trata o erro como "sem dados"). Idempotente: pode rodar
-- duas vezes sem erro. Só o service_role executa as funções.

create index if not exists order_items_tenant_product_idx
  on public.order_items (tenant_id, product_id) where kind = 'product';

create or replace function public.top_products_sold(p_tenant uuid, p_limit integer default 30)
returns table (product_id uuid, units bigint)
language sql stable security definer set search_path = public as $$
  select oi.product_id, sum(oi.qty)::bigint as units
  from order_items oi
  join orders o on o.id = oi.order_id and o.tenant_id = oi.tenant_id
  where oi.tenant_id = p_tenant and oi.kind = 'product' and oi.product_id is not null
    and o.status in ('pago','em_preparacao','pronto','saiu_para_entrega','entregue')
  group by oi.product_id
  order by units desc, oi.product_id
  limit greatest(least(coalesce(p_limit, 30), 200), 1)
$$;
revoke all on function public.top_products_sold(uuid, integer) from public, anon, authenticated;
grant execute on function public.top_products_sold(uuid, integer) to service_role;

create table if not exists public.product_clicks (
  tenant_id  uuid    not null references public.tenants(id)  on delete cascade,
  product_id uuid    not null references public.products(id) on delete cascade,
  day        date    not null,
  clicks     integer not null default 0,
  primary key (tenant_id, product_id, day)
);
create index if not exists product_clicks_tenant_day_idx on public.product_clicks (tenant_id, day desc);
alter table public.product_clicks enable row level security;
revoke all on public.product_clicks from public, anon, authenticated;
grant all on public.product_clicks to service_role;

create or replace function public.increment_product_click(p_product uuid)
returns void language sql volatile security definer set search_path = public as $$
  insert into product_clicks (tenant_id, product_id, day, clicks)
  select p.tenant_id, p.id, (now() at time zone 'America/Sao_Paulo')::date, 1
  from products p where p.id = p_product and p.active
  on conflict (tenant_id, product_id, day) do update set clicks = product_clicks.clicks + 1
$$;
revoke all on function public.increment_product_click(uuid) from public, anon, authenticated;
grant execute on function public.increment_product_click(uuid) to service_role;

create or replace function public.top_products_clicked(p_tenant uuid, p_days integer default 30, p_limit integer default 30)
returns table (product_id uuid, clicks bigint)
language sql stable security definer set search_path = public as $$
  select pc.product_id, sum(pc.clicks)::bigint as clicks
  from product_clicks pc
  where pc.tenant_id = p_tenant
    and pc.day >= ((now() at time zone 'America/Sao_Paulo')::date - greatest(coalesce(p_days,30),1))
  group by pc.product_id
  order by clicks desc, pc.product_id
  limit greatest(least(coalesce(p_limit, 30), 200), 1)
$$;
revoke all on function public.top_products_clicked(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.top_products_clicked(uuid, integer, integer) to service_role;
