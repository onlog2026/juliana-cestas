-- 0044_frete_por_cep.sql
-- Frete por FAIXA de CEP: o cliente digita o CEP e o sistema acha a faixa que o
-- contém -> zona (preço + prazo). Escala pro Brasil (a lojista cadastra faixas
-- de outras cidades/estados). Também: frete grátis acima de um valor.
--
-- Idempotente. Tenant da Juliana fixo: a0000000-0000-4000-8000-000000000001.

-- 1) Prazo por zona (dias úteis). Opcional — null = não mostra prazo.
alter table delivery_zones add column if not exists prazo_min_days integer;
alter table delivery_zones add column if not exists prazo_max_days integer;

-- 2) Frete grátis acima de um valor (por loja). null = sem frete grátis.
alter table delivery_settings add column if not exists free_shipping_min_cents integer
  check (free_shipping_min_cents is null or free_shipping_min_cents >= 0);

-- 3) Faixas de CEP -> zona. Uma zona pode ter VÁRIAS faixas (ex.: Lago Sul/Norte).
create table if not exists delivery_cep_ranges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  zone_id uuid not null references delivery_zones(id) on delete cascade,
  cep_start integer not null check (cep_start between 0 and 99999999),
  cep_end integer not null check (cep_end between 0 and 99999999),
  created_at timestamptz not null default now(),
  check (cep_end >= cep_start),
  unique (tenant_id, cep_start, cep_end)
);
create index if not exists delivery_cep_ranges_lookup
  on delivery_cep_ranges (tenant_id, cep_start, cep_end);

alter table delivery_cep_ranges enable row level security;

-- RLS: igual às zonas (0003/0020). Sem select público — a vitrine lê por service
-- role no servidor; o staff da própria loja tem CRUD.
do $$ begin
  create policy "delivery_cep_ranges_staff_all" on delivery_cep_ranges for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- 4) Seed das faixas do DF para a loja da Juliana. Blocos conservadores por RA.
--    ATENÇÃO (dono): confira/ajuste na tela Frete — os limites de CEP do DF são
--    bagunçados. São Sebastião ficou SEM faixa de propósito (CEP ambíguo): a
--    dona cadastra a faixa dela no painel. CEP que não casa = "não atendido"
--    (mostra WhatsApp), nunca cobra errado.
insert into delivery_cep_ranges (tenant_id, zone_id, cep_start, cep_end)
select z.tenant_id, z.id, r.cep_start, r.cep_end
from delivery_zones z
join (values
  ('Plano Piloto',          70000000, 70999999),
  ('Cruzeiro/Sudoeste',     70600000, 70699999),
  ('Guará',                 71000000, 71099999),
  ('SIA/Estrutural',        71200000, 71299999),
  ('Lago Sul/Lago Norte',   71500000, 71599999),
  ('Lago Sul/Lago Norte',   71600000, 71699999),
  ('Núcleo Bandeirante',    71700000, 71799999),
  ('Riacho Fundo I/II',     71800000, 71899999),
  ('Águas Claras',          71900000, 71999999),
  ('Vicente Pires',         72000000, 72009999),
  ('Taguatinga Norte/Sul',  72010000, 72199999),
  ('Ceilândia',             72200000, 72299999),
  ('Samambaia',             72300000, 72399999),
  ('Gama',                  72400000, 72499999),
  ('Santa Maria',           72500000, 72599999),
  ('Recanto das Emas',      72600000, 72699999),
  ('Brazlândia',            72700000, 72799999),
  ('Sobradinho',            73000000, 73099999),
  ('Planaltina',            73300000, 73399999)
) as r(name, cep_start, cep_end) on r.name = z.name
where z.tenant_id = 'a0000000-0000-4000-8000-000000000001'
on conflict (tenant_id, cep_start, cep_end) do nothing;
