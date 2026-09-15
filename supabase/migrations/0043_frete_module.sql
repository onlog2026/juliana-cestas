-- 0043_frete_module.sql
-- "Frete" vira um MÓDULO PRÓPRIO do painel (item separado de "Entregas"), com a
-- tela de cadastro de áreas/preços. Mesmo formato da 0026/0031.
--
-- ATENÇÃO: `src/lib/modules/registry.ts` é a cópia TypeScript desta lista e
-- `tests/unit/registry.test.ts` prova que as duas batem — o teste lê 0026, 0031
-- e AGORA esta migração (0043) também. Ao adicionar aqui, mantenha os dois em dia.

insert into platform_modules (slug, name, description, category, is_core, sort_order) values
  ('frete', 'Frete', 'Áreas de entrega por bairro/região e o preço de cada uma.', 'operacao', false, 28)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category = excluded.category, is_core = excluded.is_core, sort_order = excluded.sort_order;

-- A loja fundadora tem tudo incluído — o módulo novo também.
insert into plan_modules (plan_id, module_slug, status)
select p.id, m.slug, 'included'
from subscription_plans p, platform_modules m
where p.slug = 'fundadora' and m.slug = 'frete'
on conflict (plan_id, module_slug) do update set status = 'included';
