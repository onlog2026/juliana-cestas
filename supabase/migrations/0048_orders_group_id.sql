-- 0048_orders_group_id.sql — carrinho de presentes: N pedidos, 1 grupo.
--
-- O carrinho novo deixa o cliente montar várias cestas (cada uma com seu
-- próprio destinatário, entrega, data/horário e cartãozinho) sob UM comprador
-- e UMA finalização. Cada cesta continua sendo um `orders` normal (recipient/
-- delivery/card/total já moram lá) -- só ganham um `group_id` em comum para a
-- tela e o admin mostrarem "estas N cestas são do mesmo pedido".
--
-- group_id NULL = pedido avulso (compra direta de 1 produto, como já
-- funciona hoje) -- nada muda para o fluxo existente. Aditivo e idempotente.

alter table orders
  add column if not exists group_id uuid;

create index if not exists orders_group_id_idx on orders (tenant_id, group_id);
