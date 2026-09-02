-- 0005_realtime.sql — avisa o comprador quando o status do pedido muda,
-- sem precisar abrir RLS de SELECT em `orders` pro publico anonimo.
-- O payload do broadcast so leva status (nunca nome/endereco/etc).

create or replace function public.orders_broadcast_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    perform realtime.send(
      jsonb_build_object('status', new.status, 'payment_status', new.payment_status, 'paid_at', new.paid_at),
      'status',
      'order:' || new.id::text,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_broadcast_status_trg on orders;
create trigger orders_broadcast_status_trg after update on orders
  for each row execute function public.orders_broadcast_status();
