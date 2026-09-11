-- 0040 — Subcategorias de categoria.
--
-- Uma categoria passa a poder ter uma categoria "pai". A hierarquia é de UM
-- nível de propósito: categoria principal (parent_id NULL) -> subcategoria
-- (parent_id preenchido). O produto continua ligado por products.category_id,
-- que pode apontar tanto para uma categoria principal quanto para uma
-- subcategoria -- por isso NÃO é preciso mexer na tabela products.
--
-- O ícone da categoria reaproveita a coluna image_url, que já existe.

alter table categories
  add column if not exists parent_id uuid references categories(id) on delete restrict;

comment on column categories.parent_id is
  'Categoria pai. NULL = categoria principal; preenchido = subcategoria (1 nível). ON DELETE RESTRICT: não deixa apagar uma categoria que ainda tem subcategorias.';

-- Uma categoria não pode ser pai de si mesma.
alter table categories
  drop constraint if exists categories_parent_not_self;
alter table categories
  add constraint categories_parent_not_self check (parent_id is null or parent_id <> id);

-- Busca rápida das subcategorias de uma categoria, já na ordem certa.
create index if not exists categories_tenant_parent_idx
  on categories (tenant_id, parent_id, sort_order);
