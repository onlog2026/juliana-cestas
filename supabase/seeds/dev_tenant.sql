-- supabase/seeds/dev_tenant.sql -- SEGUNDA LOJA, só para testes de isolamento.
-- NÃO é migration: não roda em produção por padrão. Colar no SQL Editor do
-- projeto de desenvolvimento/teste quando precisar provar que uma loja não
-- enxerga a outra. Idempotente.
--
-- Tudo dela usa o id a0000000-0000-4000-8000-000000000002 e o slug loja-teste.

insert into tenants (id, slug, name, whatsapp)
values ('a0000000-0000-4000-8000-000000000002', 'loja-teste', 'Loja Teste', '5561900000000')
on conflict (id) do update set slug = excluded.slug, name = excluded.name, whatsapp = excluded.whatsapp;

insert into products (tenant_id, slug, name, serves, size, price_cents, items, packaging, image_url, badge, sort_order)
values
  ('a0000000-0000-4000-8000-000000000002', 'kit-teste-um', 'Kit Teste Um', 'Para 1 pessoa', 'P', 9990,
   '["Item A","Item B","Item C"]'::jsonb, 'Embalagem de teste.', '/images/produtos/cesta-doce-manha.webp', null, 1),
  ('a0000000-0000-4000-8000-000000000002', 'kit-teste-dois', 'Kit Teste Dois', 'Para 2 pessoas', 'M', 19990,
   '["Item D","Item E"]'::jsonb, 'Embalagem de teste.', '/images/produtos/cesta-afeto.webp', 'Teste', 2)
on conflict (tenant_id, slug) do update set
  name = excluded.name, price_cents = excluded.price_cents, items = excluded.items,
  image_url = excluded.image_url, badge = excluded.badge, sort_order = excluded.sort_order, updated_at = now();

insert into delivery_settings (tenant_id)
values ('a0000000-0000-4000-8000-000000000002')
on conflict (tenant_id) do nothing;

insert into delivery_zones (tenant_id, name, fee_cents, sort_order)
values ('a0000000-0000-4000-8000-000000000002', 'Zona Teste', 1500, 1)
on conflict (tenant_id, name) do nothing;

insert into banners (tenant_id, slug, image_url, href, text, text_position, object_position, active, sort_order)
values ('a0000000-0000-4000-8000-000000000002', 'banner-teste', '/images/banners/banner-vitrine.webp', '/',
  'Banner da loja de teste.', '{"top":40,"left":6,"maxWidth":50}'::jsonb, '50% 50%', true, 1)
on conflict (tenant_id, slug) do update set text = excluded.text, active = excluded.active;

-- Staff da loja de teste: criar o usuário em Authentication -> Add user
-- (ex.: staff-loja-teste@exemplo.com) e depois:
--   insert into profiles (id, tenant_id, role, name)
--   values ('<uuid-do-usuario>', 'a0000000-0000-4000-8000-000000000002', 'admin', 'Staff Teste')
--   on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role;
-- Esse usuário é o "staff B" de tests/isolation/tenant-isolation.mjs.
