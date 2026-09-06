-- 0031_inventory_purchases.sql — estoque com histórico e compras de insumos.
--
-- O QUE ESTA MIGRAÇÃO RESOLVE
-- Hoje o produto tem `stock_quantity` e `cost_cents`, mas os dois são campos
-- soltos: alguém digita um número na tela do produto e pronto. Ninguém
-- consegue responder "por que sumiram 3 unidades?" nem "quanto essa cesta
-- custou pra montar?". Esta migração cria a origem dos números:
--
--   compra de insumo  ->  entra no estoque  ->  sai no financeiro como despesa
--
-- DECISÕES QUE VALEM PARA SEMPRE (não mudar sem ler isto)
--
-- 1. DINHEIRO SEMPRE EM CENTAVOS, `integer`, e o nome da coluna diz isso
--    (`_cents`). Nunca `numeric` de reais, nunca duas unidades na mesma tela.
--    É a regra que a 0026 já tinha adotado depois do erro do Agentop.
--
-- 2. O ESTOQUE NÃO É EDITADO, ELE É O RESULTADO DAS MOVIMENTAÇÕES.
--    `products.stock_quantity` continua sendo o saldo que as telas leem (é
--    rápido e já está em uso no site), mas toda mudança dele passa a gravar
--    uma linha em `stock_movements` com `balance_after` — o saldo DEPOIS
--    daquela linha. Sem isso, "sumiram 3 unidades" não tem resposta, e essa
--    pergunta sempre aparece.
--
-- 3. MOVIMENTAÇÃO NUNCA É APAGADA NEM EDITADA. Errou? Grava outra linha
--    corrigindo. Por isso não existe `updated_at` aqui: a tabela é um
--    livro-caixa, não um formulário.
--
-- 4. NÃO CRIEI COLUNA NOVA DE ESTOQUE. As colunas já existem desde a 0013 e
--    estão em uso no site e no painel:
--       products.stock_quantity      -> saldo (null = ilimitado/sob encomenda,
--                                       que NÃO é a mesma coisa que 0 = esgotado)
--       products.low_stock_threshold -> o "estoque mínimo" (alerta)
--       products.cost_cents          -> custo unitário médio, em centavos
--    Criar `stock_min` ao lado de `low_stock_threshold` seria duas verdades
--    para a mesma pergunta — exatamente o erro das listas espelhadas que a
--    0026 documenta. Os `add column if not exists` abaixo existem só para o
--    caso de um banco que ainda não tenha rodado a 0013; num banco em dia eles
--    não fazem nada.
--
-- 5. RLS FECHADA POR LOJA em todas as tabelas novas, sem NENHUMA política
--    pública. A 0020 nasceu de oito políticas que liberavam SELECT para `anon`
--    sem filtro de loja; custo de insumo e nome de fornecedor são justamente o
--    tipo de dado que não pode vazar entre lojas. Todas as leituras destas
--    tabelas acontecem no servidor com service role, que ignora RLS.
--
-- Idempotente. Não roda nada sozinha.

-- ── Colunas do produto (só se faltarem; ver decisão 4) ───────────────────────
alter table products add column if not exists cost_cents integer;
alter table products add column if not exists stock_quantity integer;
alter table products add column if not exists low_stock_threshold integer;

comment on column products.cost_cents is
  'Custo unitário MÉDIO PONDERADO em centavos, recalculado a cada compra. null = nunca comprado/nunca informado (é "não sei", não é zero).';
comment on column products.stock_quantity is
  'Saldo atual. null = estoque ilimitado/sob encomenda (≠ 0 = esgotado). Só muda junto com uma linha em stock_movements.';
comment on column products.low_stock_threshold is
  'Estoque mínimo: abaixo ou igual a isto, o painel mostra alerta. null = sem alerta.';

-- ── Fornecedores ────────────────────────────────────────────────────────────
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists suppliers_tenant_idx on suppliers (tenant_id, name);

-- ── Compras (a nota que a lojista recebeu) ──────────────────────────────────
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  supplier_id uuid references suppliers(id),
  -- Data da compra no calendário de Brasília (`date`, não `timestamptz`): o
  -- relatório do mês é por calendário, e a lojista digita "05/09", não um
  -- instante com fuso.
  purchased_at date not null default (now() at time zone 'America/Sao_Paulo')::date,
  invoice_number text,
  -- SEMPRE a soma dos itens, calculada no SERVIDOR. Nunca o número que veio do
  -- formulário: total digitado à mão é o caminho mais curto para o financeiro
  -- não bater com o estoque.
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists purchases_tenant_date_idx on purchases (tenant_id, purchased_at desc);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  purchase_id uuid not null references purchases(id) on delete cascade,
  -- null = insumo que não vira produto do catálogo (embalagem, fita, cartão).
  -- Entra no financeiro como despesa, mas não movimenta estoque de produto.
  product_id uuid references products(id),
  description text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost_cents integer not null check (unit_cost_cents >= 0),
  total_cents integer not null check (total_cents >= 0)
);
create index if not exists purchase_items_purchase_idx on purchase_items (purchase_id);
create index if not exists purchase_items_product_idx on purchase_items (tenant_id, product_id);

-- ── Movimentações de estoque (o livro-caixa das unidades) ───────────────────
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id),
  kind text not null check (kind in ('entrada','saida','ajuste','perda')),
  -- O que `quantity` significa depende do `kind` — e isto é de propósito:
  --   entrada/saida/perda -> quantas unidades entraram ou saíram;
  --   ajuste              -> quantas unidades EXISTEM de verdade na prateleira
  --                          (contagem física). A diferença fica visível em
  --                          `balance_after` comparado com a linha anterior.
  quantity numeric(12,3) not null check (quantity >= 0),
  unit_cost_cents integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  -- Ajuste e perda exigem motivo escrito (regra do negócio, checada também no
  -- servidor). Sem motivo, a linha do livro-caixa não explica nada.
  reason text,
  reference_type text,   -- 'compra' | 'manual' | (futuro: 'pedido')
  reference_id uuid,
  -- O SALDO DEPOIS desta linha. É o que transforma a tabela em extrato.
  balance_after numeric(12,3) not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint stock_movements_reason_required
    check (kind in ('entrada','saida') or (reason is not null and length(btrim(reason)) > 0))
);
create index if not exists stock_movements_tenant_date_idx on stock_movements (tenant_id, created_at desc);
create index if not exists stock_movements_product_idx on stock_movements (tenant_id, product_id, created_at desc);

comment on table stock_movements is
  'Extrato de estoque. Linha nunca é apagada nem editada: correção é uma NOVA linha. balance_after é o saldo depois do lançamento.';

-- ── RLS: tudo por loja, nada público ────────────────────────────────────────
alter table suppliers enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table stock_movements enable row level security;

do $$ begin
  create policy "suppliers_staff_all" on suppliers for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "purchases_staff_all" on purchases for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "purchase_items_staff_all" on purchase_items for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Estoque: staff da loja LÊ o extrato pelo client autenticado, mas quem grava é
-- sempre o servidor (service role). Escrita direta pelo navegador criaria
-- movimentação sem passar pelo cálculo de saldo — o extrato deixaria de fechar.
do $$ begin
  create policy "stock_movements_staff_select" on stock_movements for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- ── Catálogo de módulos vendáveis (mesmo formato da 0026) ───────────────────
-- ATENÇÃO: `src/lib/modules/registry.ts` é a cópia TypeScript desta lista e
-- `tests/unit/registry.test.ts` prova que as duas batem — mas o teste lê
-- SOMENTE a migração 0026. Ao acrescentar `estoque` e `compras` no registry.ts,
-- o teste precisa passar a ler esta migração também (ver relatório).
insert into platform_modules (slug, name, description, category, is_core, sort_order) values
  ('estoque', 'Estoque',  'Saldo, custo, estoque mínimo e o extrato de cada entrada e saída.', 'operacao', false, 26),
  ('compras', 'Compras',  'Compras de insumos: alimenta o estoque e lança a despesa.',         'operacao', false, 27)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category = excluded.category, is_core = excluded.is_core, sort_order = excluded.sort_order;

-- A loja fundadora tem tudo incluído — os módulos novos também.
insert into plan_modules (plan_id, module_slug, status)
select p.id, m.slug, 'included'
from subscription_plans p, platform_modules m
where p.slug = 'fundadora' and m.slug in ('estoque','compras')
on conflict (plan_id, module_slug) do update set status = 'included';
