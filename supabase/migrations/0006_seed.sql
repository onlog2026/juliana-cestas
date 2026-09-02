-- 0006_seed.sql — tenant unico, catalogo real (de src/lib/mock-content.ts),
-- zonas de entrega provisorias, banners (espelho de src/lib/banners.ts).
-- Idempotente: on conflict do update, seguro rodar de novo.

insert into tenants (id, slug, name, whatsapp)
values ('a0000000-0000-4000-8000-000000000001', 'juliana-present', 'Juliana Present', '5561998894889')
on conflict (id) do update set name = excluded.name, whatsapp = excluded.whatsapp;

insert into products (tenant_id, slug, name, serves, size, price_cents, items, packaging, image_url, badge, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'cesta-enquanto', 'Cesta Enquanto', 'Para 1 pessoa', 'P', 17990,
   '["Flores","Bolo","Croissant recheado","Nutella","Cappuccino","Chá","Café","Suco de uva integral"]'::jsonb,
   'Embalagem em tule, delicada e charmosa. Acompanha laço elegante e cartão.',
   '/images/produtos/cesta-doce-manha.jpeg', null, 1),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-afeto', 'Cesta Afeto', 'Para 1 pessoa', 'P', 18990,
   '["Bolo","Waffle","Croissant","Frutas","Frios selecionados","Cappuccino","Chá","Café ou suco de uva integral"]'::jsonb,
   'Embalagem sofisticada, delicada e charmosa. Acompanha laço elegante e cartão.',
   '/images/produtos/cesta-aniversario-especial.jpeg', null, 2),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-essencia', 'Cesta Essência', 'Para 1 pessoa', 'Orgânica', 28990,
   '["Bolo caseiro","Waffle e pães","Croissant","Frios selecionados","Biscoitos","Frutas","Cappuccino, café e chá","Geleia ou Nutella","Suco de uva integral"]'::jsonb,
   'Embalagem sofisticada, delicada e charmosa - perfeita para surpreender com amor.',
   '/images/produtos/cesta-cafe-completo.png', 'Mais pedida', 3),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-aconchego', 'Cesta Aconchego', 'Para 2 pessoas', 'M', 35990,
   '["Variedade de pães especiais","Croissant","Waffles","Frios selecionados premium","Bolo caseiro especial","Biscoitos amanteigados","Mix de frutas frescas","Suco natural","Drip coffee e chá","Cappuccino","Geleia e mini Nutella","Chocolates"]'::jsonb,
   'Embalagem refinada, delicada e charmosa. Acompanha laço elegante e cartão personalizado.',
   '/images/produtos/cesta-presente-corporativo.jpeg', null, 4),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-memoravel', 'Cesta Memorável', 'Perfeita para 2 ou 3 pessoas', 'G', 48990,
   '["Croissants especiais","Waffles","Frios nobres e queijos","Bolo especial","Frutas selecionadas","Chocolates","Seleção premium de pães artesanais","Geleia artesanal, Nutella e manteiga","Itens gourmet diferenciados","Biscoitos amanteigados","Drip coffee e chás","Suco"]'::jsonb,
   'Embalagem luxo, acabamento impecável. Acompanha laço delicado e cartão personalizado.',
   '/images/produtos/cesta-romance-ao-amanhecer.jpeg', null, 5)
on conflict (tenant_id, slug) do update set
  name = excluded.name, serves = excluded.serves, size = excluded.size,
  price_cents = excluded.price_cents, items = excluded.items, packaging = excluded.packaging,
  image_url = excluded.image_url, badge = excluded.badge, sort_order = excluded.sort_order,
  updated_at = now();

-- Vinho opcional, so na Memoravel (mencionado no texto real da embalagem).
insert into product_addons (tenant_id, product_id, slug, name, price_cents)
select 'a0000000-0000-4000-8000-000000000001', id, 'vinho', 'Vinho', 4990
from products where tenant_id = 'a0000000-0000-4000-8000-000000000001' and slug = 'cesta-memoravel'
on conflict (product_id, slug) do update set price_cents = excluded.price_cents;

insert into delivery_settings (tenant_id)
values ('a0000000-0000-4000-8000-000000000001')
on conflict (tenant_id) do nothing;

-- Regioes administrativas de Brasilia -- taxa 0 e placeholder=true ate a
-- Juliana confirmar os valores reais no painel de configuracoes.
insert into delivery_zones (tenant_id, name, fee_cents, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'Plano Piloto (Asa Sul)', 0, 1),
  ('a0000000-0000-4000-8000-000000000001', 'Plano Piloto (Asa Norte)', 0, 2),
  ('a0000000-0000-4000-8000-000000000001', 'Sudoeste/Octogonal', 0, 3),
  ('a0000000-0000-4000-8000-000000000001', 'Noroeste', 0, 4),
  ('a0000000-0000-4000-8000-000000000001', 'Lago Sul', 0, 5),
  ('a0000000-0000-4000-8000-000000000001', 'Lago Norte', 0, 6),
  ('a0000000-0000-4000-8000-000000000001', 'Águas Claras', 0, 7),
  ('a0000000-0000-4000-8000-000000000001', 'Taguatinga', 0, 8),
  ('a0000000-0000-4000-8000-000000000001', 'Guará', 0, 9),
  ('a0000000-0000-4000-8000-000000000001', 'Ceilândia', 0, 10),
  ('a0000000-0000-4000-8000-000000000001', 'Samambaia', 0, 11)
on conflict (tenant_id, name) do nothing;

-- Espelho de src/lib/banners.ts (a fonte de verdade continua o arquivo ate
-- a Fase B ligar o carrossel no banco).
insert into banners (tenant_id, slug, image_url, href, text, text_position, object_position, active, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'cesta-completa', '/images/banners/banner-cesta-completa.png', '/categoria/cafe-da-manha',
   'Detalhes que encantam, sabores que emocionam, amor que se celebra.',
   '{"top":78,"left":6,"maxWidth":92}'::jsonb, '62% 45%', true, 1),
  ('a0000000-0000-4000-8000-000000000001', 'mesa-manha', '/images/banners/banner-mesa-manha.png', '/categoria/cafe-da-manha',
   'Cestas de café da manhã, montadas à mão em Brasília.',
   '{"top":40,"left":6,"maxWidth":40}'::jsonb, '40% 50%', true, 2),
  ('a0000000-0000-4000-8000-000000000001', 'ingredientes', '/images/banners/banner-ingredientes.png', '/categoria/cafe-da-manha',
   'Presentes que surpreendem, feitos à mão por encomenda.',
   '{"top":10,"left":6,"maxWidth":42}'::jsonb, '45% 50%', true, 3),
  ('a0000000-0000-4000-8000-000000000001', 'vitrine', '/images/banners/banner-vitrine.png', '/categoria/cafe-da-manha',
   'Presente pra quem você ama, entregue em Brasília.',
   '{"top":40,"left":60,"maxWidth":36}'::jsonb, '50% 45%', true, 4),
  ('a0000000-0000-4000-8000-000000000001', 'lifestyle', '/images/banners/banner-lifestyle.png', '/categoria/cafe-da-manha',
   'Momentos gostosos começam com a cesta certa.',
   '{"top":8,"left":6,"maxWidth":44}'::jsonb, '50% 40%', true, 5),
  ('a0000000-0000-4000-8000-000000000001', 'dia-das-maes', '/images/banners/banner-dia-das-maes.png', '/categoria/cafe-da-manha',
   'Um presente especial pro Dia das Mães.',
   '{"top":78,"left":6,"maxWidth":50}'::jsonb, '50% 50%', false, 6)
on conflict (tenant_id, slug) do update set
  image_url = excluded.image_url, href = excluded.href, text = excluded.text,
  text_position = excluded.text_position, object_position = excluded.object_position,
  active = excluded.active, sort_order = excluded.sort_order;

-- Usuario admin NAO entra por migracao (auth.users nao aceita insert direto
-- por SQL comum). Passo manual, documentado em docs/OPERACAO.md:
--   1. Supabase Dashboard -> Authentication -> Add user -> contatoagentop@gmail.com
--   2. Copiar o UUID gerado e rodar:
--      insert into profiles (id, tenant_id, role)
--      values ('<uuid-do-usuario>', 'a0000000-0000-4000-8000-000000000001', 'admin')
--      on conflict (id) do update set role = 'admin';
