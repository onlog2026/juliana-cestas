-- 0045_notifications_whatsapp.sql
-- Estende o outbox `notifications` (hoje só e-mail) para aceitar WhatsApp: o
-- aviso de "pedido novo" que vai pro número da loja assim que o cliente fecha
-- a compra (Evolution API, inerte até o dono configurar as envs).
--
-- Idempotente.

-- 1) Canal: 'email' (default, preserva as linhas existentes) ou 'whatsapp'.
alter table notifications add column if not exists channel text not null default 'email'
  check (channel in ('email', 'whatsapp'));

-- 2) Destinatário de WhatsApp (número, só dígitos). to_email segue existindo
--    para o canal email; nenhum dos dois é NOT NULL agora, porque cada canal
--    usa só o seu.
alter table notifications alter column to_email drop not null;
alter table notifications add column if not exists to_phone text;

-- 3) type: acrescenta 'store_new_order' à lista já existente (0004+0017+0030+0037).
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    'order_confirmed', 'out_for_delivery', 'delivered',
    'ticket_created', 'ticket_reply',
    'review_invite', 'cart_recovery',
    'store_new_order'
  ));

-- 4) Um aviso de "pedido novo" por pedido (idempotência do disparo): índice
--    único parcial, só para esse tipo -- os outros tipos continuam podendo
--    repetir por pedido (ex.: reenvio manual de e-mail).
create unique index if not exists notifications_store_new_order_once
  on notifications (order_id)
  where type = 'store_new_order';
