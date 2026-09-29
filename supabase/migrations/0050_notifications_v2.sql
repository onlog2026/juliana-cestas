-- 0050_notifications_v2.sql
-- E-mails novos do pedido: "pagamento confirmado" (order_paid) e "resumo do
-- carrinho" (order_group_confirmed). Só acrescenta os dois tipos à lista aceita
-- pelo outbox `notifications`; o resto da lista é a de 0045.
--
-- O código NÃO depende desta migração para ENVIAR o e-mail (se o banco recusar o
-- tipo novo, o e-mail sai do mesmo jeito, só sem o registro no outbox) -- rode
-- para o painel e a proteção contra e-mail duplicado passarem a enxergar os avisos.
--
-- Idempotente.

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    'order_confirmed', 'order_paid', 'order_group_confirmed',
    'out_for_delivery', 'delivered',
    'ticket_created', 'ticket_reply',
    'review_invite', 'cart_recovery',
    'store_new_order'
  ));
